import { html, css, TemplateResult, PropertyValueMap, CSSResult } from 'lit';
import { consume } from '@lit/context';
import { StoreSubscriber } from 'lit-svelte-stores';

import { object, string } from 'yup';
import { appletInstanceInfosContext } from '../../context';
import {
  EntryHash,
  EntryHashB64,
  decodeHashFromBase64,
  encodeHashToBase64,
} from '@holochain/client';
import { compareUint8Arrays } from '@neighbourhoods/app-loader';

import NHAlert from '@neighbourhoods/design-system-components/alert';
import NHAssessmentContainer from '@neighbourhoods/design-system-components/widgets/assessment-container';
import NHButton from '@neighbourhoods/design-system-components/button';
import NHButtonGroup from '@neighbourhoods/design-system-components/button-group';
import NHCard from '@neighbourhoods/design-system-components/card';
import NHDialog from '@neighbourhoods/design-system-components/dialog';
import NHDropdownAccordion from '@neighbourhoods/design-system-components/dropdown-accordion';
import NHForm from '@neighbourhoods/design-system-components/form/form';
import NHPageHeaderCard from '@neighbourhoods/design-system-components/page-header-card';
import NHResourceAssessmentTray from '@neighbourhoods/design-system-components/widgets/resource-assessment-tray';
import NHSpinner from '@neighbourhoods/design-system-components/spinner';
import NHTooltip from '@neighbourhoods/design-system-components/tooltip';
import NHComponent from '@neighbourhoods/design-system-components/ancestors/base';
import NHTextInput from '@neighbourhoods/design-system-components/input/text';
import { b64images } from '@neighbourhoods/design-system-styles';

import { property, query, queryAll, state } from 'lit/decorators.js';
import {
  AssessmentWidgetBlockConfig,
  AssessmentWidgetConfig,
  AssessmentControlRegistrationInput,
  AssessmentControlRenderer,
  Constructor,
  Dimension,
  InputAssessmentControlDelegate,
  Method,
  ResourceDef,
  SensemakerStore,
} from '@neighbourhoods/client';
import {repeat} from 'lit/directives/repeat.js';
import { InputAssessmentRenderer } from '@neighbourhoods/app-loader';
import { derived } from 'svelte/store';
import { Applet } from '../../types';
import { FakeInputAssessmentControlDelegate } from '@neighbourhoods/app-loader';
import { dimensionIncludesControlRange } from '../../utils';
import { ResourceBlockRenderer } from '@neighbourhoods/app-loader';

export default class NHAssessmentWidgetConfig extends NHComponent {
  @property() loaded!: boolean;

  sensemakerStore!: SensemakerStore;

  @consume({ context: appletInstanceInfosContext })
  @property({attribute: false}) _currentAppletInstances;

  // Asssessment/Resource renderer dictionary, keyed by Applet EH
  @state() _appletInstanceRenderers : StoreSubscriber<any> = new StoreSubscriber(
    this,
    () =>  derived(this._currentAppletInstances.store, (appletInstanceInfos: any) => {
      //@ts-ignore
      return !!appletInstanceInfos && Object.values(appletInstanceInfos).some(appletInfo => appletInfo!.gui)
      //@ts-ignore
        ? Object.fromEntries(Object.entries(appletInstanceInfos).map(([appletEh, appletInfo]) => {
          if(typeof appletInfo?.gui == 'undefined') return;
          return [appletEh, {...(appletInfo as any)?.gui?.resourceRenderers, ...(appletInfo as any).gui.assessmentControls}]
        }))
        : null
    }),
    () => [this.loaded],
  );

  @property() // Selected from the sub-menu of the page
  resourceDef!: ResourceDef & {resource_def_eh: EntryHash };

  currentApplet!: Applet;

  @query('nh-form') private _form;
  @query('#success-toast') private _successAlert;
  @query("nh-button[type='submit']") private submitBtn;
  @queryAll("assessment-container") private _assessmentContainers;

  @state() loading: boolean = false;
  @state() editMode: boolean = false;
  @state() editingConfig: boolean = false;
  @state() updatedComponent!: Constructor<unknown> | undefined;
  @state() placeHolderWidget!: (() => TemplateResult) | undefined;
  @state() configuredWidgetsPersisted: boolean = true; // Is the in memory representation the same as on DHT?
  
  @state() selectedWidgetIndex: number | undefined = -1; // -1 represents the placeholder widget, otherwise this is the index of the widget in the renderableWidgets array
  @state() selectedWidgetKey: string | undefined; // nh-form select options for the 2nd/3rd selects are configured dynamically when this state change triggers a re-render
  @state() selectedInputDimensionEh: EntryHash | undefined; // used to filter for the 3rd select

  @state() _workingWidgetControls: AssessmentWidgetBlockConfig[] = [];
  @state() _workingWidgetControlRendererCache: Map<string, (delegate?: InputAssessmentControlDelegate, component?: unknown) => TemplateResult> = new Map();

  @state() private _trayName!: string; // Text input value for the name
  @state() private _trayNameFieldErrored: boolean = false; // Flag for errored status on name field
  
  // AssessmentWidgetBlockConfig (group) and AssessmentControlRegistrationInputs (individual)
  @state() private _fetchedConfig!: AssessmentWidgetBlockConfig[];
  @state() private _updateToFetchedConfig!: AssessmentWidgetBlockConfig[];
  @state() private _registeredWidgets: Record<EntryHashB64, AssessmentControlRegistrationInput> = {};

  // Derived from _fetchedConfig
  @state() configuredInputWidgets!: AssessmentWidgetBlockConfig[];

  @state() private _inputDimensionEntries!: Array<Dimension & { dimension_eh: EntryHash }>;
  @state() private _outputDimensionEntries!: Array<Dimension & { dimension_eh: EntryHash }>;
  /* Temp - need to add Store method that returns records with entry hashes*/
  @state() private _unpartitionedDimensionEntries!: Array<Dimension & { dimension_eh: EntryHash }>;
  @state() private _rangeEntries!: Array<Range & { range_eh: EntryHash }>;
  @state() private _methodEntries!: Method[] | undefined;


  async firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    this.loading = true;
    try {
      if (!this.sensemakerStore) return;
      await this.fetchDimensionEntries();
      await this.fetchRangeEntries();
      await this.fetchMethodEntries();
      await this.partitionDimensionEntries();
      await this.fetchRegisteredWidgets();
      if(this.editMode && this._updateToFetchedConfig) {
        this._fetchedConfig = this._updateToFetchedConfig;
      } else {
        await this.fetchExistingWidgetConfigBlock();
      }

      this.loading = false;
    } catch (error) {
      console.error('Could not fetch/assign applet and widget data: ', error);
      this.loading = false;
    }
  }

  protected async updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    if(changedProperties.has('resourceDef') && typeof changedProperties.get('resourceDef') !== 'undefined') {
      await this.resetWorkingState()
      await this.fetchExistingWidgetConfigBlock();
    }
  }

  private findInputDimensionsForOutputDimension(outputDimensionEh: EntryHash) {
    const methods = this._methodEntries!.filter((method: Method) => compareUint8Arrays(method.output_dimension_eh, outputDimensionEh))
    return methods.map((method: Method) => method.input_dimension_ehs[0])
  }

  private findOutputDimensionForInputDimension(inputDimensionEh: EntryHash) {
    const methods = this._methodEntries!.filter((method: Method) => compareUint8Arrays(method.input_dimension_ehs[0], inputDimensionEh))
    return methods.map((method: Method) => method.output_dimension_eh)[0]
  }

  private getCombinedWorkingAndFetchedWidgets() {
    let widgets: AssessmentWidgetBlockConfig[]
    if((this._updateToFetchedConfig || this._fetchedConfig) && this._workingWidgetControls && this._workingWidgetControls.length > 0) {
      widgets = this._fetchedConfig.length > 0 ? [
        ...(this._updateToFetchedConfig || this._fetchedConfig), ...this._workingWidgetControls
      ] : this._workingWidgetControls;
    } else if(this._fetchedConfig) {
      widgets = this._fetchedConfig;
    } else {
      widgets = [];
    }
    return widgets;
  }

  private async resetWorkingState() {
    await this.fetchExistingWidgetConfigBlock();
    this.configuredWidgetsPersisted = true
    this.placeHolderWidget = undefined;
    this.selectedWidgetKey = undefined;
    this.selectedWidgetIndex = undefined;
    this._workingWidgetControls = [];
    this.configuredInputWidgets = this._fetchedConfig
    this.resetAssessmentControlsSelected()
    this._form.reset()
    this.requestUpdate()
  }

  // Methods for managing the state of the placeholder/selected control
  renderWidgetControlPlaceholder() {
    if(!this.editMode && typeof this.selectedWidgetKey != 'undefined' && this._workingWidgetControlRendererCache?.has(this.selectedWidgetKey) && this?.placeHolderWidget) {
      return repeat([this.selectedWidgetKey], () => +(new Date), (_, _idx) => this.placeHolderWidget!())
    }
    return html`<span slot="assessment-control"></span>`
  }
  handleAssessmentControlSelected(e: CustomEvent) {
    this.resetAssessmentControlsSelected();
    e.currentTarget.selected = true;
    this.editMode = true;
    this.editingConfig = true;
    
    const selectedIndex = [...this._assessmentContainers].findIndex(container => container.selected)
    this.selectedWidgetIndex = selectedIndex;
    this._form.reset()
    if(selectedIndex == -1 || e.currentTarget.id == 'placeholder') {
      this.editMode = false;
      this.placeHolderWidget = undefined;
      this._form.requestUpdate()
    }
  }
  undoDeselect(e: CustomEvent) {
    const container = e.target as NHAssessmentContainer;
    container.selected = true;
    container.requestUpdate()
  }
  resetAssessmentControlsSelected() {
      this._assessmentContainers
        .forEach((container) => container.selected = false);
  }
  reselectPlaceholderControl() {
      const containers = [...this._assessmentContainers]
      const placeHolderContainer = containers[containers.length - 1]?.id == "placeholder" && containers[containers.length - 1];
      if(placeHolderContainer) placeHolderContainer.selected = true;
  }

  render(): TemplateResult {
    let renderableWidgets = (this.configuredInputWidgets || this.getCombinedWorkingAndFetchedWidgets())?.map((widgetRegistrationEntry: AssessmentWidgetBlockConfig) => widgetRegistrationEntry.inputAssessmentWidget as AssessmentWidgetConfig)
    
    const foundEditableWidget = this.editMode && this.selectedWidgetIndex !== -1 && renderableWidgets[this.selectedWidgetIndex as number] && Object.values(this._registeredWidgets)?.find(widget => widget.name == renderableWidgets[this.selectedWidgetIndex as number]?.componentName);
    const foundEditableWidgetConfig = this.editMode && this.selectedWidgetIndex as number !== -1 && renderableWidgets[this.selectedWidgetIndex as number]
    return html`
      <div class="container" @assessment-widget-config-set=${async () => {await this.fetchRegisteredWidgets()}}>
        <nh-page-header-card .heading=${'Assessment Widget Config'}>
          <nh-button
            slot="secondary-action"
            .variant=${'neutral'}
            .size=${'icon'}
            .iconImageB64=${b64images.icons.backCaret}
            @click=${() => this.onClickBackButton()}
          >
          </nh-button>
        </nh-page-header-card>

        <div class="description">
          <p>Add as many widgets as you need - the changes won't be saved until the Update Config button is pressed</p>
        </div>
        <div>
          <div class="tray-name-field">
            <nh-text-input
              id="tray-name"
              .name="tray-name"
              .label=${"Name:"}
              .size=${"medium"}
              .placeholder=${"Enter a name"}
              .required=${true}
              .errored=${this._trayNameFieldErrored}
              @change=${(e) => (this._trayName = e.target.value)}
            ></nh-text-input>
          </div>
          <div class="widget-block-config">
            <assessment-widget-tray
              .editable=${true}
              .editing=${!!this.editingConfig}
            >
              <div slot="widgets">
                ${
                  this._appletInstanceRenderers?.value && (this._fetchedConfig && this._fetchedConfig.length > 0 || this?._workingWidgetControls)
                    ? repeat(renderableWidgets, (widget) => `${encodeHashToBase64(widget.dimensionEh)}-${(widget as any).componentName.replace(" ","")}`, (inputWidgetConfig, idx) => {
                        const appletEh = (inputWidgetConfig as any)?.appletId;
                        const appletKey = appletEh && encodeHashToBase64(appletEh);
                        const appletRenderers = this._appletInstanceRenderers.value[appletKey] as (AssessmentWidgetConfig | ResourceBlockRenderer)[];
                        if(!appletRenderers) throw new Error('Could not get applet renderers linked to this ResourcDef');

                        const foundComponent = Object.values(appletRenderers).find(component => component.name == (inputWidgetConfig as { dimensionEh: EntryHash, appletId: string, componentName: string }).componentName);
                        if(!foundComponent) return;

                        const controlKey = Object.values(this._registeredWidgets).find(widget => widget.name == foundComponent.name)?.controlKey;
                        const renderBlock = this._workingWidgetControlRendererCache.get(controlKey as string);
                        if(!controlKey || !renderBlock) return;

                        const templateResult = !!this.updatedComponent ? renderBlock(undefined, this.updatedComponent) : renderBlock(undefined, foundComponent.component);
                        const hasUpdated = !!this.updatedComponent;
                        if(hasUpdated) this.updatedComponent = undefined;

                        return html`
                          <assessment-container .editMode=${true}
                            @selected=${this.handleAssessmentControlSelected}
                            @deselected=${this.undoDeselect}
                            .selected=${idx == this.selectedWidgetIndex}
                          >
                            <span slot="assessment-output">0</span>
                            ${templateResult}
                          </assessment-container>
                        `;
                      })
                    : null
                }
                ${this.loading 
                  ? html`<nh-spinner type=${"icon"}></nh-spinner>`
                  : this.editingConfig || !this._fetchedConfig
                    ? html` <assessment-container .editMode=${true}
                              id="placeholder"
                              @selected=${this.handleAssessmentControlSelected}
                              @deselected=${this.undoDeselect}
                              .selected=${this.selectedWidgetIndex == -1}
                            >
                              <span slot="assessment-output">0</span>
                              ${this.renderWidgetControlPlaceholder()}
                            </assessment-container>`
                    : null}
              </div>
              <div slot="controls">
                <div name="add-widget-icon" class="add-widget-icon" @click=${async (e: CustomEvent) => {
                  this.resetAssessmentControlsSelected();
                  this.reselectPlaceholderControl();
                  this.editingConfig = true;
                }}>
                  ${
                  this.editingConfig
                  ? html`<nh-spinner type=${"icon"}></nh-spinner>`
                  : html`
                    <nh-tooltip .variant=${this.editingConfig ? "warning" : "success"} text="To add a widget, click the plus icon." class="right">
                      <img slot="hoverable" class="add-assessment-icon" src=${`data:image/svg+xml;base64,${b64images.icons.plus}`} alt=${"Add a widget"} />
                    </nh-tooltip>
                  `
                  }
                </div>
              </div>
            </assessment-widget-tray>
            <nh-button
              id="set-widget-config"
              .variant=${'primary'}
              .loading=${this.loading}
              .disabled=${!this.loading && this._fetchedConfig && this.configuredWidgetsPersisted}
              .size=${'md'}
              @click=${async () => {
                if(!this._trayName || this._trayName == "") {
                  this._trayNameFieldErrored = true;
                  return
                }
                try {
                  await this.createEntries();
                  this._trayNameFieldErrored = false;
                } catch (error) {
                  console.warn('error :>> ', error);
                }
                this._successAlert.openToast();
                this.configuredWidgetsPersisted = true
              }}
            >Update Config</nh-button>
          </div>

          <nh-dropdown-accordion
            .open=${!!this.editingConfig}
            @submit-successful=${async () => {
              this.placeHolderWidget = undefined;
              this.requestUpdate()
              await this.updateComplete
          }}>
            <div slot="inner-content">
              <h2>${this.editMode ? "Update Control" : "Add Control"}</h2>
              ${this.renderMainForm(!!foundEditableWidget ? foundEditableWidget : null, !!foundEditableWidgetConfig ? foundEditableWidgetConfig : null)}
            </div>
            ${this.renderButtonGroup()}
          </nh-dropdown-accordion>
            
          <nh-alert
            id="success-toast"
            .title=${"You have saved your changes."}
            .description=${"You have saved your changes."}
            .closable=${true}
            .isToast=${true}
            .open=${false}
            .type=${"success"}></nh-alert>
          </div>
        </div>
      </div>
    </div>`;
  }

  async replaceInMemoryWidgetControl(model: any) {
    if(typeof this.selectedWidgetIndex == 'undefined') throw new Error('No widget index so cannot replace widget control in working widgets array');
    const { assessment_widget, input_dimension, output_dimension } = model;

    const selectedWidgetDetails = Object.entries(this._registeredWidgets || {}).find(
      ([_widgetEh, widget]) => widget.name == assessment_widget,
    );
    const selectedWidgetEh = selectedWidgetDetails?.[0];
    if (!selectedWidgetEh) return Promise.reject('Could not get an entry hash for your selected widget.');

    const inputDimensionBinding = {
      type: "applet",
      appletId: this.resourceDef.applet_eh as any,
      componentName: assessment_widget,
      dimensionEh: decodeHashFromBase64(input_dimension),
    } as AssessmentWidgetConfig;
    const outputDimensionBinding = {
      type: "applet",
      appletId: this.resourceDef.applet_eh as any,
      componentName: assessment_widget,
      dimensionEh: decodeHashFromBase64(output_dimension),
    } as AssessmentWidgetConfig;
    const input = {
      inputAssessmentWidget: inputDimensionBinding,
      outputAssessmentWidget: outputDimensionBinding,
    }
    const isFromWorkingConfig = this.selectedWidgetIndex > this._fetchedConfig.length;
    let newIndex = isFromWorkingConfig ? (this.selectedWidgetIndex - this._fetchedConfig.length - 1) : this.selectedWidgetIndex;
    (isFromWorkingConfig ? this._workingWidgetControls : this._fetchedConfig).splice(newIndex, 1, input);

    this._updateToFetchedConfig = this._fetchedConfig;
    this.configuredWidgetsPersisted = false;
    
    this.requestUpdate();
  }
  
  async pushToInMemoryWidgetControls(model: any) {
    const { assessment_widget, input_dimension, output_dimension } = model;

    const selectedWidgetDetails = Object.entries(this._registeredWidgets || {}).find(
      ([_widgetEh, widget]) => widget.name == assessment_widget,
    );
    const selectedWidgetEh = selectedWidgetDetails?.[0];
    if (!selectedWidgetEh) return Promise.reject('Could not get an entry hash for your selected widget.');

    const inputDimensionBinding = {
      type: "applet",
      appletId: this.resourceDef.applet_eh as any,
      componentName: assessment_widget,
      dimensionEh: decodeHashFromBase64(input_dimension),
    } as AssessmentWidgetConfig;
    const outputDimensionBinding = {
      type: "applet",
      appletId: this.resourceDef.applet_eh as any,
      componentName: assessment_widget,
      dimensionEh: decodeHashFromBase64(output_dimension),
    } as AssessmentWidgetConfig;
    const input = {
      inputAssessmentWidget: inputDimensionBinding,
      outputAssessmentWidget: outputDimensionBinding,
    }
    this.configuredInputWidgets = [ ...this?.getCombinedWorkingAndFetchedWidgets(), input];
    this._workingWidgetControls = [ ...(this?._workingWidgetControls || []), input];
    this.configuredWidgetsPersisted = false;

    this.resetAssessmentControlsSelected();
    this.selectedWidgetIndex = -1;
    this.editMode = false;
    this.reselectPlaceholderControl();
    this.requestUpdate();
  }

  async createEntries() {
    if(!this._workingWidgetControls || !(this._workingWidgetControls.length > 0)) throw Error('Nothing to persist, try adding another widget to the config.')
    const resource_def_eh = this.resourceDef?.resource_def_eh;

    let successful;
    try {
      successful = await (
        this.sensemakerStore as SensemakerStore
      ).setAssessmentTrayConfig(resource_def_eh, this.getCombinedWorkingAndFetchedWidgets());
    } catch (error) {
      return Promise.reject('Error setting assessment widget config');
    }
    if (!successful) return;
    console.log('successfully set the widget tray config? ', successful);
    await this.updateComplete;
    this._form.dispatchEvent(
      new CustomEvent('assessment-widget-config-set', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  handleFormChange = async e => {
    const widgets = typeof this._registeredWidgets == 'object' && Object.values(this._registeredWidgets) || []

    const selectedWidget = widgets?.find(widget => widget.name == this._form._model.assessment_widget);
    this.selectedWidgetKey = selectedWidget?.controlKey;

    this.placeHolderWidget = this?._workingWidgetControlRendererCache.get(this.selectedWidgetKey as string) as (delegate?: InputAssessmentControlDelegate) => TemplateResult;

    this.selectedInputDimensionEh = this._form._model.input_dimension;

    e.currentTarget.requestUpdate();
    await e.currentTarget.updateComplete;
  }

  private renderButtonGroup(): TemplateResult {
    return html`
      <nh-button-group
        .direction=${'horizontal'}
        class="action-buttons"
        slot="actions"
      >
        <span slot="buttons">
          <nh-button
            id="close-widget-config"
            .variant=${'danger'}
            .size=${'md'}
            @click=${async () => {
              this.editingConfig = false;
              await this.resetWorkingState()
            }}
          >Cancel</nh-button>

          <nh-button
            id="reset-widget-config"
            .variant=${'warning'}
            .size=${'md'}
            @click=${async () => {
              if(this.editingConfig) {
                await this.resetWorkingState();
                this.reselectPlaceholderControl()
              }
              this._form.reset()
            }}
          >Reset</nh-button>

          <nh-button
            type="submit"
            id="add-widget-config"
            .variant=${'success'}
            .size=${'md'}
          >${this.editMode ? "Update" : "Add"}</nh-button>
        </span>
      </nh-button-group>
    `
  }

  private renderMainForm(foundEditableWidget?: AssessmentControlRegistrationInput | null, foundEditableWidgetConfig?: AssessmentWidgetConfig | null): TemplateResult {
    return html`
      <nh-form
        class="responsive"
        @change=${this.handleFormChange}
        .config=${{
          submitBtnRef: (() => this.submitBtn)(),
          rows: [1, 1, 1],
          fields: [
            [
              {
                type: 'select',
                placeholder: 'Select',
                label: '1. Select an assessment control for this resource: ',
                selectOptions: (() =>
                  this?._registeredWidgets && this?._appletInstanceRenderers.value
                    ? Object.values(this._registeredWidgets)!
                      .filter((widget: AssessmentControlRegistrationInput) => {
                        const linkedResourceDefApplet = Object.values(this._currentAppletInstances.value).find(applet => compareUint8Arrays(applet.appletId, this.resourceDef.applet_eh))
                        const fromLinkedApplet = !!linkedResourceDefApplet && (linkedResourceDefApplet.appInfo.installed_app_id == widget.appletId)
                        return fromLinkedApplet && widget.kind == "input"
                      })
                      .map((widget: AssessmentControlRegistrationInput) => {
                          const possibleRenderers : ({string: AssessmentControlRenderer | ResourceBlockRenderer})[] = this._appletInstanceRenderers.value[encodeHashToBase64(this.resourceDef.applet_eh)];
                          const renderer = possibleRenderers[widget.controlKey];
                          if(!renderer || renderer?.kind !== 'input') throw new Error('Could not fill using widget renderer as none could be found')
                          let renderBlock = (delegate?: InputAssessmentControlDelegate, component?: any) => html`
                            <input-assessment-renderer slot="assessment-control"
                              .component=${component || renderer.component}
                              .nhDelegate=${delegate || new FakeInputAssessmentControlDelegate()}
                            ></input-assessment-renderer>`

                          this._workingWidgetControlRendererCache?.set(widget.controlKey, renderBlock)
                          return ({
                            label: widget.name,
                            value: widget.name,
                            renderBlock
                          })})
                    : []
                )(), // IIFE regenerates select options dynamically
                name: 'assessment_widget',
                id: 'assessment-widget',
                size: 'large',
                required: true,
                handleInputChangeOverload: (_e, model) => { // Update the currently editable widget constrol renderer component
                  if(this.editMode) {
                    const possibleRenderers : ({string: AssessmentControlRenderer | ResourceBlockRenderer})[] = this._appletInstanceRenderers.value[encodeHashToBase64(this.resourceDef.applet_eh)];
                    const widget = Object.values(this._registeredWidgets)?.find(widget=> widget.name == model.assessment_widget);
                    if(!widget?.controlKey || widget?.kind !== 'input' || !(possibleRenderers[widget.controlKey])) throw new Error('Could not update currently editable widget control')
                    const renderer = possibleRenderers[widget.controlKey];
                    this.updatedComponent = renderer.component;
                    model.input_dimension = undefined;
                    model.output_dimension = undefined;
                  }
                },
                useDefault: () => !this._form?.touched.assessment_widget,
                defaultValue: (() => !!foundEditableWidget ? ({
                  label: foundEditableWidget.name,
                  value: foundEditableWidget.name,
                  renderBlock: this._workingWidgetControlRendererCache.get(foundEditableWidget.controlKey)
                }) : null)()
              },
            ],

            [
              {
                type: 'select',
                placeholder: 'Select',
                label: '2. Select the input dimension: ',
                selectOptions: (() =>
                  this._rangeEntries && this._rangeEntries.length
                    ? this?._inputDimensionEntries
                        ?.filter(dimension => {
                          const selectedWidgetRangeKind = Object.values(
                            this._registeredWidgets,
                          ).find(widget => widget.controlKey == this.selectedWidgetKey)?.rangeKind;
                          if (typeof this.selectedWidgetKey == 'undefined' || !selectedWidgetRangeKind) return false;

                          const dimensionRange = this._rangeEntries!.find(range =>
                            compareUint8Arrays(range.range_eh, dimension.range_eh),
                          ) as any;
                          return dimensionIncludesControlRange(
                            dimensionRange.kind,
                            selectedWidgetRangeKind,
                          );
                        })
                        .map(dimension => {
                          return {
                            label: dimension.name,
                            value: encodeHashToBase64(dimension.dimension_eh),
                          };
                        })
                    : [])(),
                name: 'input_dimension',
                id: 'input-dimension',
                size: 'large',
                required: true,
                useDefault: () => !(this?._form?.touched && this._form.touched.assessment_widget),
                defaultValue: (() => {
                  if(!!foundEditableWidgetConfig) {
                    const dimensionName = this._inputDimensionEntries.find(dimension => compareUint8Arrays(dimension.dimension_eh, foundEditableWidgetConfig!.dimensionEh))?.name
                    return {
                      label: dimensionName || 'Could not retrieve dimension',
                      value: encodeHashToBase64(foundEditableWidgetConfig!.dimensionEh),
                    } 
                  }
                })()
              },
            ],

            [
              {
                type: 'select',
                placeholder: 'Select',
                label: '3. Select the output dimension: ',
                selectOptions: (() =>
                this._methodEntries && this?._outputDimensionEntries
                  ? this._outputDimensionEntries
                    ?.filter(dimension => {
                      if(typeof this._methodEntries !== 'undefined') {
                        const inputDimensions = this.findInputDimensionsForOutputDimension(dimension.dimension_eh);
                        return inputDimensions.map(eh => encodeHashToBase64(eh)).includes(this._form._model.input_dimension)
                      } else return false
                    })
                    .map(dimension => ({
                      label: dimension.name,
                      value: encodeHashToBase64(dimension.dimension_eh),
                    }))
                  : []).bind(this)(),
                name: 'output_dimension',
                id: 'output-dimension',
                size: 'large',
                required: true,
                useDefault: () => !(this?._form?.touched && this._form.touched.assessment_widget) && typeof this._methodEntries !== 'undefined',
                defaultValue: (() => {
                  const outputDimensionEh = foundEditableWidgetConfig && this.findOutputDimensionForInputDimension(foundEditableWidgetConfig!.dimensionEh);
                  const outputDimension = outputDimensionEh && this._outputDimensionEntries.find(dimension => compareUint8Arrays(dimension.dimension_eh, outputDimensionEh))
                  return !!outputDimension 
                    ? { 
                        label: outputDimension?.name || 'Could not retrieve dimension',
                        value: encodeHashToBase64(outputDimensionEh)
                      } 
                    : null
                })()
              },
            ],
          ],
          submitOverload: model => this.editMode ? this.replaceInMemoryWidgetControl(model) : this.pushToInMemoryWidgetControls(model),
          schema: object({
            assessment_widget: string()
              .min(1, 'Must be at least 1 characters')
              .required('Select a widget'),
            input_dimension: string()
              .min(1, 'Must be at least 1 characters')
              .required('Select an input dimension'),
            output_dimension: string()
              .min(1, 'Must be at least 1 characters')
              .required('Select an output dimension'),
          }),
        }}
      >
      </nh-form>
    `;
  }

  static elementDefinitions = {
    'nh-button': NHButton,
    'nh-button-group': NHButtonGroup,
    'nh-card': NHCard,
    'nh-form': NHForm,
    'nh-dialog': NHDialog,
    'nh-page-header-card': NHPageHeaderCard,
    'nh-tooltip': NHTooltip,
    'nh-dropdown-accordion': NHDropdownAccordion,
    'nh-spinner': NHSpinner,
    'nh-alert': NHAlert,
    'nh-text-input': NHTextInput,
    'assessment-widget-tray': NHResourceAssessmentTray,
    'input-assessment-renderer': InputAssessmentRenderer,
    'assessment-container': NHAssessmentContainer,
  };

  private onClickBackButton() {
    this.dispatchEvent(new CustomEvent('return-home', { bubbles: true, composed: true }));
  }

  static styles: CSSResult[] = [
    ...super.styles as CSSResult[],
    css`
      /* Layout */
      :host {
        width: 100%;
        height: 100%;
      }

      div.container {
        width: 100%;
        display: flex;
        color: var(--nh-theme-fg-default);
        gap: calc(1px * var(--nh-spacing-sm));
        flex-direction: column;  
        padding: calc(1px * var(--nh-spacing-xl));
        box-sizing: border-box;
      }

      div.tray-name-field {
        width: 18rem;
        margin: 0 auto 1rem auto;
      }

      nh-page-header-card {
        grid-column: 1 / -1;
      }

      .description {
        text-align: center;
      }

      input-assessment-renderer {
        display: flex;
        align-items: center;
      }

      /* Typo */
      h2 {
        text-align: center;
        margin: 0 auto;
        width: 18rem;
      }

      /* Top of the page display for current widget config with create/update actions */
      .widget-block-config {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        width: 100%;
      }

      /* Form actions */
      .action-buttons {
        position: absolute;
        right: calc(1px * var(--nh-spacing-xl));
        bottom: calc(1px * var(--nh-spacing-xs));
      }

      /* Form layout */
      nh-form {
        display: flex;
        max-width: initial !important;
        min-height: 5rem;
      }

      .add-assessment-icon {
        height: 32px;
        width: 32px;
        margin: 4px;
        padding: 0px;
        border-radius: calc(1px * var(--nh-radii-xl));
        background-color: var(--nh-theme-accent-default);
      }

      .add-assessment-icon:hover {
        background-color: var(--nh-theme-accent-emphasis);
        cursor: pointer;
      }

      @media (min-width: 1350px) {
        form {
          flex-wrap: nowrap;
          padding-bottom: 0;
          margin-bottom: 0;
        }
        :host {
          overflow: hidden;
        }
      }
  `];


  async fetchExistingWidgetConfigBlock() {
    if (!this.sensemakerStore || !this.resourceDef) return;
    try {
      this._fetchedConfig = await this.sensemakerStore.getAssessmentTrayConfig(
        this.resourceDef?.resource_def_eh,
      );
      console.log('fetched persisted widget config block :>> ', this._fetchedConfig);
    } catch (error) {
      console.error(error);
    }
  }

  async partitionDimensionEntries() {
    try {
      const input: any = [];
      const output: any = [];
      this._unpartitionedDimensionEntries!.forEach(dimension => {
        if (dimension.computed) {
          output.push(dimension);
          return;
        }
        input.push(dimension);
      });
      this._inputDimensionEntries = input;
      this._outputDimensionEntries = output;
    } catch (error) {
      console.log('Error partitioning dimensions: ', error);
    }
  }

  async fetchRegisteredWidgets() {
    try {
      this._registeredWidgets = await this.sensemakerStore!.getRegisteredWidgets();
    } catch (error) {
      console.log('Error fetching widget registrations: ', error);
    }
  }

  async fetchRangeEntries() {
    await this.fetchRangeEntriesFromHashes(
      this._unpartitionedDimensionEntries.map((dimension: Dimension) => dimension.range_eh),
    );
  }

  async fetchMethodEntries() {
    this._methodEntries = (await this.sensemakerStore?.getMethods())?.map(eR => eR.entry);
  }

  async fetchDimensionEntries() {
    try {
      const entryRecords = await this.sensemakerStore?.getDimensions();
      this._unpartitionedDimensionEntries = entryRecords!.map(entryRecord => {
        return {
          ...entryRecord.entry,
          dimension_eh: entryRecord.entryHash
        }
      })
    } catch (error) {
      console.log('Error fetching dimension details: ', error);
    }
  }

  async fetchRangeEntriesFromHashes(rangeEhs: EntryHash[]) {
    let response;
    try {
      response = await Promise.all(rangeEhs.map(eH => this.sensemakerStore?.getRange(eH)))
    } catch (error) {
      console.log('Error fetching range details: ', error);
    }
    this._rangeEntries = response.map((entryRecord) => ({...entryRecord.entry, range_eh: entryRecord.entryHash})) as Array<Range & { range_eh: EntryHash }>;
  }
}
