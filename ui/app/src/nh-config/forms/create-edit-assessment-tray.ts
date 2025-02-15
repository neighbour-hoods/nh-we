import { html, css, TemplateResult, PropertyValueMap, CSSResult } from 'lit';
import { consume } from '@lit/context';
import { StoreSubscriber } from 'lit-svelte-stores';

import { appletInstanceInfosContext } from '../../context';
import {
  ActionHash,
  EntryHash,
  EntryHashB64,
  decodeHashFromBase64,
  encodeHashToBase64,
} from '@holochain/client';
import { FakeInputAssessmentControlDelegate, ResourceBlockRenderer, compareUint8Arrays } from '@neighbourhoods/app-loader';

import NHAlert from '@neighbourhoods/design-system-components/alert';
import NHAssessmentContainer from '@neighbourhoods/design-system-components/widgets/assessment-container';
import NHButton from '@neighbourhoods/design-system-components/button';
import NHButtonGroup from '@neighbourhoods/design-system-components/button-group';
import NHCard from '@neighbourhoods/design-system-components/card';
import NHDialog from '@neighbourhoods/design-system-components/dialog';
import NHDropdownAccordion from '@neighbourhoods/design-system-components/dropdown-accordion';
import NHForm from '@neighbourhoods/design-system-components/form/form';
import NHResourceAssessmentTray from '@neighbourhoods/design-system-components/widgets/resource-assessment-tray';
import NHSpinner from '@neighbourhoods/design-system-components/spinner';
import NHTooltip from '@neighbourhoods/design-system-components/tooltip';
import NHComponent from '@neighbourhoods/design-system-components/ancestors/base';
import NHTextInput from '@neighbourhoods/design-system-components/input/text';
import { b64images } from "@neighbourhoods/design-system-styles";

import { property, query, queryAll, state } from 'lit/decorators.js';
import {
  AssessmentControlConfig,
  DimensionControlMapping,
  AssessmentControlRegistrationInput,
  Constructor,
  Dimension,
  InputAssessmentControlDelegate,
  Method,
  SensemakerStore,
  AssessmentTrayConfig,
  NHDelegateReceiverConstructor,
} from '@neighbourhoods/client';
import {repeat} from 'lit/directives/repeat.js';
import { InputAssessmentRenderer } from '@neighbourhoods/app-loader';
import { derived } from 'svelte/store';
import { object, string } from 'yup';
import { dimensionIncludesControlRange } from '../../utils';

export default class CreateOrEditTrayConfig extends NHComponent {
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
        ? Object.fromEntries((Object.entries(appletInstanceInfos) || [])?.map(([appletEh, appletInfo]) => {
          if(typeof appletInfo?.gui == 'undefined') return;
          return [appletEh, {...(appletInfo as any)?.gui?.resourceRenderers, ...(appletInfo as any).gui.assessmentControls}]
        }).filter(value => !!value) || [])
        : null
    }),
    () => [this.loading],
  );

  @query('nh-form') private _form;
  @query("nh-button[type='submit']") private submitBtn;
  @queryAll("assessment-container") private _assessmentContainers;

  @state() loading: boolean = false;
  @state() editMode: boolean = false;
  @property() editingConfig: boolean = false;
  @state() updatedComponent!: Constructor<unknown> | undefined;
  @state() placeHolderWidget!: (() => TemplateResult) | undefined;
  @state() configuredWidgetsPersisted: boolean = true; // Is the in memory representation the same as on DHT?
  
  @state() selectedWidgetIndex: number | undefined = -1; // -1 represents the placeholder widget, otherwise this is the index of the widget in the renderableWidgets array
  @state() selectedWidgetKey: string | undefined; // nh-form select options for the 2nd/3rd selects are configured dynamically when this state change triggers a re-render
  @state() selectedInputDimensionEh: EntryHash | undefined; // used to filter for the 3rd select

  @state() _workingWidgetControls: AssessmentControlConfig[] = [];
  @state() _workingAssessmentControlRendererCache: Map<string, (delegate?: InputAssessmentControlDelegate, component?: NHDelegateReceiverConstructor<InputAssessmentControlDelegate>) => TemplateResult> = new Map();

  @query("nh-text-input") trayNameInput!: NHTextInput;
  @state() private _trayName!: string; // Text input value for the name
  @state() private _trayNameFieldErrored: boolean = false; // Flag for errored status on name field
  
  // AssessmentTrayConfig (group) and AssessmentControlRegistrationInputs (individual)
  @property() fetchedConfig?: AssessmentTrayConfig | undefined;
  @property() fetchedConfigAh?: ActionHash;

  @state() private _updateToFetchedConfig!: AssessmentTrayConfig;
  @state() private _registeredWidgets: Record<EntryHashB64, AssessmentControlRegistrationInput> = {};

  @state() private _inputDimensionEntries!: Array<Dimension & { dimension_eh: EntryHash }>;
  @state() private _outputDimensionEntries!: Array<Dimension & { dimension_eh: EntryHash }>;

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
      await this.fetchRegisteredAssessmentControls();
      if(this.editingConfig && this._updateToFetchedConfig) {
        this.fetchedConfig = this._updateToFetchedConfig;
      }
      this.loading = false;
    } catch (error) {
      console.error('Could not fetch/assign applet and widget data: ', error);
      this.loading = false;
    }
  }

  async updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    if(changedProperties.has("editingConfig") && this.fetchedConfig && this.fetchedConfig?.name) {
      this._trayName = this.fetchedConfig.name;
      this.trayNameInput._input.value = this._trayName;
      this.editingConfig = true;
      this.selectedWidgetIndex = -1;
      this.trayNameInput.requestUpdate()
      await this.requestUpdate()
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
    let widgets: AssessmentControlConfig[]

    if((this._updateToFetchedConfig || this.fetchedConfig) && this._workingWidgetControls && this._workingWidgetControls.length > 0) {
      widgets = (this.fetchedConfig?.assessmentControlConfigs as any).length > 0 ? [
        ...(this._updateToFetchedConfig?.assessmentControlConfigs || this.fetchedConfig?.assessmentControlConfigs), ...this._workingWidgetControls
      ] : this._workingWidgetControls;
    } else if(this.fetchedConfig) {
      widgets = this.fetchedConfig.assessmentControlConfigs;
    } else {
      widgets = [...this._workingWidgetControls];
    }
    return widgets;
  }

  private async resetWorkingState() {
    this.configuredWidgetsPersisted = !this.fetchedConfig
    this.placeHolderWidget = undefined;
    this.selectedWidgetKey = undefined;
    this.selectedWidgetIndex = undefined;
    this.fetchedConfig = undefined;
    this.fetchedConfigAh = undefined;
    this.editingConfig = false;
    this._workingWidgetControls = [];

    this.resetAssessmentControlsSelected()
    this._trayName = "";
    this.trayNameInput._input.value = "";
    this._trayNameFieldErrored = false;
    this._form.reset()
    this.requestUpdate()
  }

  // Methods for managing the state of the placeholder/selected control
  renderWidgetControlPlaceholder() {
    if(!this.editMode && typeof this.selectedWidgetKey != 'undefined' && this._workingAssessmentControlRendererCache?.has(this.selectedWidgetKey) && this?.placeHolderWidget) {
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
    let renderableWidgets = this.getCombinedWorkingAndFetchedWidgets()?.map((widgetRegistrationEntry: AssessmentControlConfig) => widgetRegistrationEntry.inputAssessmentControl as DimensionControlMapping)

    const foundEditableWidget = this.editMode && this.selectedWidgetIndex !== -1 && renderableWidgets[this.selectedWidgetIndex as number] && Object.values(this._registeredWidgets)?.find(widget => widget.name == renderableWidgets[this.selectedWidgetIndex as number]?.componentName);
    const foundEditableWidgetConfig = this.editMode && this.selectedWidgetIndex as number !== -1 && renderableWidgets[this.selectedWidgetIndex as number]
    return html`
      <div class="container" @assessment-widget-config-set=${async () => {await this.fetchRegisteredAssessmentControls()}}>
        <div class="description">
          <p>Add as many widgets as you need - the changes won't be saved until the ${!this.fetchedConfig ? "Create" : "Update"} Config button is pressed</p>
        </div>
        <section class="form">
          <div class="tray-name-field">
            <nh-text-input
              .value=${(this.editingConfig && this.fetchedConfig?.name) || ""}
              id="tray-name"
              .name="tray-name"
              .label=${"Name:"}
              .size=${"medium"}
              .placeholder=${"Enter a name"}
              .required=${true}
              .errored=${this._trayNameFieldErrored}
              @change=${(e) => {this._trayName = e.target.value}}
            ></nh-text-input>
          </div>
          <div class="widget-block-config">
            <assessment-tray
              .editable=${true}
              .editing=${!!this.editingConfig}
            >
              <div slot="widgets">
                ${this._appletInstanceRenderers?.value && (this.fetchedConfig && this.fetchedConfig.assessmentControlConfigs.length > 0 || this?._workingWidgetControls)
                    ? repeat(renderableWidgets, (widget) => `${encodeHashToBase64(widget.dimensionEh)}-${(widget as any).componentName.replace(" ","")}`, (inputWidgetConfig, idx) => {
                        const allAppletRenderers = Object.values(this._appletInstanceRenderers.value).flatMap(renderers => Object.values(renderers as any)) as (DimensionControlMapping | ResourceBlockRenderer)[];
                        if(!allAppletRenderers) throw new Error('Could not get applet renderers linked to this ResourcDef');
                        const foundComponent = allAppletRenderers.find(component => component.name == (inputWidgetConfig as { dimensionEh: EntryHash, appletId: string, componentName: string }).componentName);
                        if(!foundComponent) return;

                        const controlKey = Object.values(this._registeredWidgets).find(widget => widget.name == foundComponent.name)?.controlKey;
                        const renderBlock = this._workingAssessmentControlRendererCache.get(controlKey as string);
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
                  : this.editingConfig || !this.fetchedConfig
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
                    <nh-tooltip .variant=${this.editingConfig ? "warning" : "success"} text="To add a widget, click the plus icon." class="right no-icon">
                      <img slot="hoverable" class="add-assessment-icon" src=${`data:image/svg+xml;base64,${b64images.icons.plus}`} alt=${"Add a widget"} />
                    </nh-tooltip>
                  `
                  }
                </div>
              </div>
            </assessment-tray>
            <nh-button
              id="set-widget-config"
              .variant=${'primary'}
              .loading=${this.loading}
              .disabled=${!this.loading && !(this?.fetchedConfig && this.configuredWidgetsPersisted) &&
                (this.fetchedConfig
                  ? (this.fetchedConfig?.name && this.fetchedConfig.name == this._trayName) // We will actually need a deepequal on the configs to make this a rigorous validation rule. This is a simple version requiring rename
                  : (this?._workingWidgetControls && this._workingWidgetControls.length == 0))}
              .size=${'md'}
              @click=${async () => {
                if(!this._trayName || this._trayName == "") {
                  this._trayNameFieldErrored = true;
                  return
                }
                try {
                  await (!!this.fetchedConfig ? this.updateEntry() : this.createEntries());
                  this._trayNameFieldErrored = false;
                } catch (error) {
                  console.warn('error :>> ', error);
                }
                // this._successAlert.openToast();
                this.configuredWidgetsPersisted = true
              }}
            >${!this.fetchedConfig ? "Create" : "Update"} Config</nh-button>
          </div>

          <nh-dropdown-accordion
            .open=${!!this.editingConfig}
            @submit-successful=${async () => {
              this.placeHolderWidget = undefined;
              this.requestUpdate()
              await this.updateComplete
          }}>
            <div slot="inner-content">
              ${this.renderMainForm(!!foundEditableWidget ? foundEditableWidget : null, !!foundEditableWidgetConfig ? foundEditableWidgetConfig : null)}
            </div>
            ${this.renderButtonGroup()}
          </nh-dropdown-accordion>
            
        </section>
      </div>
    </div>`;
  }

  async replaceInMemoryWidgetControl(model: any) {
    if(typeof this.selectedWidgetIndex == 'undefined') throw new Error('No widget index so cannot replace widget control in working widgets array');
    const { assessment_widget, input_dimension, output_dimension } = model;

    const selectedWidgetDetails = Object.entries(this._registeredWidgets || {}).find(
      ([_widgetEh, widget]) => widget.controlKey == assessment_widget,
    );
    const selectedWidgetEh = selectedWidgetDetails?.[0];
    if (!selectedWidgetEh) return Promise.reject('Could not get an entry hash for your selected widget.');

    const {appletId, name} = selectedWidgetDetails?.[1];

    const inputDimensionBinding = {
      type: "applet",
      appletId,
      componentName: name,
      dimensionEh: decodeHashFromBase64(input_dimension),
    } as DimensionControlMapping;
    const outputDimensionBinding = {
      type: "applet",
      appletId,
      componentName: name,
      dimensionEh: decodeHashFromBase64(output_dimension),
    } as DimensionControlMapping;
    const input = {
      inputAssessmentControl: inputDimensionBinding,
      outputAssessmentControl: outputDimensionBinding,
    }
    const isFromWorkingConfig = this.selectedWidgetIndex > this.fetchedConfig!.assessmentControlConfigs!.length;
    let newIndex = isFromWorkingConfig ? (this.selectedWidgetIndex - this.fetchedConfig!.assessmentControlConfigs!.length - 1) : this.selectedWidgetIndex;
    (isFromWorkingConfig ? this._workingWidgetControls : this.fetchedConfig.assessmentControlConfigs).splice(newIndex, 1, input);

    this._updateToFetchedConfig = this.fetchedConfig;
    this.configuredWidgetsPersisted = false;
    
    this.requestUpdate();
  }
  
  async pushToInMemoryWidgetControls(model: any) {
    const { assessment_widget, input_dimension, output_dimension } = model;

    const selectedWidgetDetails = Object.entries(this._registeredWidgets || {}).find(
      ([_widgetEh, widget]) => widget.controlKey == assessment_widget,
    );
    const {appletId, name} = selectedWidgetDetails?.[1];
    if (!appletId) return Promise.reject('Could not get an entry hash for your selected widget.');

    const inputDimensionBinding = {
      type: "applet",
      appletId,
      componentName: name,
      dimensionEh: decodeHashFromBase64(input_dimension),
    } as DimensionControlMapping;
    const outputDimensionBinding = {
      type: "applet",
      appletId,
      componentName: name,
      dimensionEh: decodeHashFromBase64(output_dimension),
    } as DimensionControlMapping;
    const input = {
      inputAssessmentControl: inputDimensionBinding,
      outputAssessmentControl: outputDimensionBinding,
    }
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
    try {
      await this.sensemakerStore.setAssessmentTrayConfig({name: this._trayName, assessmentControlConfigs: this.getCombinedWorkingAndFetchedWidgets() });
    } catch (error) {
      return Promise.reject('Error setting assessment widget config');
    }
    await this.resetWorkingState();
    await this.updateComplete;
    this.dispatchEvent(
      new CustomEvent('assessment-widget-config-set', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  async updateEntry() {
    const updatedWidgets = this.getCombinedWorkingAndFetchedWidgets();
    if(updatedWidgets.length == 0 || !this.fetchedConfigAh) throw Error('Nothing to persist, try adding another widget to the config.')
    try {
      await this.sensemakerStore.updateAssessmentTrayConfig(this.fetchedConfigAh, {name: this._trayName, assessmentControlConfigs: updatedWidgets});
    } catch (error) {
      return Promise.reject('Error setting assessment widget config');
    }
    await this.resetWorkingState();
    await this.updateComplete;
    this.dispatchEvent(
      new CustomEvent('assessment-widget-config-set', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  handleFormChange = async e => {
    const widgets = typeof this._registeredWidgets == 'object' && Object.values(this._registeredWidgets) || []

    const selectedWidget = widgets?.find(widget => widget.controlKey == this._form._model.assessment_widget);
    this.selectedWidgetKey = selectedWidget?.controlKey;

    this.placeHolderWidget = this?._workingAssessmentControlRendererCache.get(this.selectedWidgetKey as string) as (delegate?: InputAssessmentControlDelegate) => TemplateResult;

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

  private renderMainForm(foundEditableWidget?: AssessmentControlRegistrationInput | null, foundEditableWidgetConfig?: DimensionControlMapping | null): TemplateResult {
    return html`
      <nh-form
        class="responsive wide"
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
                      .map((assessmentControl: AssessmentControlRegistrationInput) => {
                          const possibleRenderers = Object.values(this._appletInstanceRenderers.value)[0] as any;
                          const renderer = possibleRenderers[assessmentControl.controlKey];
                          if(!renderer || renderer?.kind !== 'input') return;
                          let renderBlock = (delegate?: InputAssessmentControlDelegate, component?: NHDelegateReceiverConstructor<InputAssessmentControlDelegate>) => html`
                            <input-assessment-renderer slot="assessment-control"
                              .component=${component || renderer.component}
                              .nhDelegate=${delegate || new FakeInputAssessmentControlDelegate()}
                            ></input-assessment-renderer>`

                          this._workingAssessmentControlRendererCache?.set(assessmentControl.controlKey, renderBlock)
                          return ({
                            label: assessmentControl.name,
                            value: assessmentControl.controlKey,
                            renderBlock
                          })}).filter(value => value)
                    : []
                )(), // IIFE regenerates select options dynamically
                name: 'assessment_widget',
                id: 'assessment-widget',
                size: 'large',
                required: true,
                handleInputChangeOverload: (_e, model) => { // Update the currently editable widget constrol renderer component
                  if(this.editMode) {
                    const possibleRenderers = Object.values(this._appletInstanceRenderers.value)[0] as any;
                    const assessmentControl = Object.values(this._registeredWidgets)?.find(assessmentControl=> assessmentControl.controlKey == model.assessment_widget);
                    if(!assessmentControl?.controlKey || assessmentControl?.kind !== 'input' || !(possibleRenderers[assessmentControl.controlKey])) throw new Error('Could not update currently editable assessmentControl control')
                    const renderer = possibleRenderers[assessmentControl.controlKey];
                    this.updatedComponent = renderer.component;
                    model.input_dimension = undefined;
                    model.output_dimension = undefined;
                  }
                },
                useDefault: () => !this._form?.touched.assessment_widget,
                defaultValue: (() => !!foundEditableWidget ? ({
                  label: foundEditableWidget.name,
                  value: foundEditableWidget.controlKey,
                  renderBlock: this._workingAssessmentControlRendererCache.get(foundEditableWidget.controlKey)
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
                          if(!this.selectedWidgetKey) return false;
                          const selectedControlRangeKind = Object.values(
                            this._registeredWidgets,
                          ).find(assessmentControl => assessmentControl.controlKey == this.selectedWidgetKey)?.rangeKind;
                          if (typeof this.selectedWidgetKey == 'undefined' || !selectedControlRangeKind) return false;

                          const dimensionRange = this._rangeEntries!.find(range =>
                            compareUint8Arrays(range.range_eh, dimension.range_eh),
                          ) as any;
                          return dimensionIncludesControlRange(
                            dimensionRange.kind,
                            selectedControlRangeKind,
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
    'nh-tooltip': NHTooltip,
    'nh-dropdown-accordion': NHDropdownAccordion,
    'nh-spinner': NHSpinner,
    'nh-alert': NHAlert,
    'nh-text-input': NHTextInput,
    'assessment-tray': NHResourceAssessmentTray,
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


  async fetchExistingTrayConfig(editableTrayConfigEntryHash: EntryHash) : Promise<AssessmentTrayConfig | undefined> {
    if (!this.sensemakerStore || !editableTrayConfigEntryHash) return;
    const defaultConfig = await this.sensemakerStore.getAssessmentTrayConfig(
      editableTrayConfigEntryHash
    );
    return defaultConfig?.entry
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

  async fetchRegisteredAssessmentControls() {
    try {
      this._registeredWidgets = await this.sensemakerStore!.getRegisteredAssessmentControls();
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
