import { css, CSSResult, html, TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { NHComponent } from './ancestors/base';
import { classMap } from "lit/directives/class-map.js";
import { AlertType } from './alert'
import NHAlert from './alert';
import NHButton from './button';
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
import SlButtonGroup from '@shoelace-style/shoelace/dist/components/button-group/button-group.js'
import SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'

export enum DialogType {
  createNeighbourhood = 'create-neighbourhood',
  leaveNeighbourhood = 'leave-neighbourhood',
  dimensionConfig = 'dimension-config',
  confirmation = 'confirmation',
  appletInstall = 'applet-install',
  appletUninstall = 'applet-uninstall',
  createDimension = 'create-dimension',
  inputForm = 'input-form',
}

function preventOverlayClose(event: CustomEvent) : void {
  if (event.detail.source === 'overlay' || event.detail.source === 'keyboard') {
    event.preventDefault();
  }
}

export default class NHDialog extends NHComponent {
  @property()
  title!: string
  @property()
  size: string = 'small';

  @property()
  dialogType!: DialogType;

  @property()
  handleOk!: () => { preventDefault?: boolean };

  @property()
  handleClose!: () => { preventDefault?: boolean };

  @property({ type: Boolean })
  isOpen = false;

  @property({ type: Boolean})
  primaryButtonDisabled = false;

  @property()
  alertMessage?: string;

  @property()
  alertType: AlertType = 'neutral';

  @property()
  openButtonRef!: HTMLElement;

  @query('sl-dialog')
  _dialog!: HTMLElement;

  disconnectedCallback() {
    super.disconnectedCallback();
    if(this.openButtonRef && typeof this.openButtonRef?.removeEventListener == 'function') {
      this.openButtonRef?.removeEventListener('click', this.showDialog);
    }
    (this._dialog as any).removeEventListener('sl-request-close', preventOverlayClose)
    typeof this.onClose == 'function' && this._dialog.removeEventListener('sl-after-hide', this.onClose);
  }

  updated(changedProperties: any) {
    if (changedProperties.has('openButtonRef')) {
      // Bind the open event to the appropriate button in the UI
      if (typeof changedProperties.get('openButtonRef') !== 'undefined') {
        this.openButtonRef?.addEventListener('click', this.showDialog);
      }
    }
  }

  firstUpdated() {
    if(!this._dialog) return
    (this._dialog as any).addEventListener('sl-request-close', preventOverlayClose)
    typeof this.onClose == 'function' && this._dialog.addEventListener('sl-after-hide', this.onClose);
  }
    
  chooseButtonText() {
    switch (this.dialogType) {
      case DialogType.createNeighbourhood:
      return {
        primary: 'Save',
        secondary: 'Cancel',
      }
    
      case DialogType.leaveNeighbourhood:
      return {
        primary: 'Leave',
        secondary: 'Cancel',
      }
    
      case DialogType.dimensionConfig:
      return {
        primary: 'Add Dimensions',
        secondary: 'Configure Manually',
      }

      case DialogType.appletInstall:
      return {
        primary: 'Install',
        secondary: 'Cancel',
      }

      case DialogType.appletUninstall:
      return {
        primary: 'Uninstall',
        secondary: 'Cancel',
      }

      case DialogType.createDimension:
      return {
        primary: 'Create Dimension',
        secondary: 'Cancel',
      }
    
      default:
        return {
          primary: 'OK',
          secondary: 'Cancel',
        }
    }
  }

  renderActions() : TemplateResult {
    return html`<sl-button-group id="buttons">
        <nh-button
          id="secondary-action-button"
          .size=${"md"}
          variant=${"neutral"}
          @click=${this.hideDialog}
        >${this.chooseButtonText().secondary}
        </nh-button>
        <slot name="primary-action">
          <nh-button
            id="primary-action-button"
            .size=${"md"}
            .variant=${this.dialogType.match(/uninstall|leave/) ? "danger" : "primary"}
            @click=${this.onOkClicked}
            .disabled=${this.primaryButtonDisabled}
            >${this.chooseButtonText().primary}
          </nh-button>
        </slot>
      </sl-button-group>`;
  }

  render() : TemplateResult {
    return html`
      <sl-dialog
        id="main"
        class="dialog-scrolling ${classMap({
          [this.size]: !!this.size,
          [this.dialogType]: !!this.dialogType,
        })}"
        ?open=${this.isOpen}
        label="${this.title}"
        @sl-hide=${(e:any) => typeof this.onClose == 'function' && this.onClose(e)}
      >
        <div class="container">
          ${this.alertMessage
          ? html`<nh-alert .type=${this.alertType}><span>${this.alertMessage}</span></nh-alert>`
          : null}
          <slot name="inner-content">
          </slot>
        </div>
        <div class="actions" slot="footer">${this.renderActions()}</div>
      </sl-dialog>
    `;
  }

  showDialog = () => {
    this.isOpen = true;
  };

  hideDialog = () => {
    this.isOpen = false;
  };

  setPrimaryActionEnabled = (value: boolean) => {
    this.primaryButtonDisabled = !value;
  };

  onClose = async (_e: any) => {
    if(typeof this.handleClose !== 'function') return; 
    
    let result : { preventDefault?: boolean };
    if (this.handleClose) {
      result = await this.handleClose();
    } else { result = { preventDefault: false }}
    // TODO: stop this from closing when result.preventDefault is true
    if(result && !(result?.preventDefault)) this.hideDialog();
  }

  onOkClicked = () => {
    let result : { preventDefault?: boolean };
    if (this.handleOk) {
      result = this.handleOk();
    } else { result = { preventDefault:   false }}
    this.hideDialog();
    if(result && result.preventDefault) this.showDialog();
  };

  static elementDefinitions = {
    'sl-dialog': SlDialog,
    'nh-alert': NHAlert,
    'sl-button-group': SlButtonGroup,
    'sl-button': SlButton,
    'nh-button': NHButton,
  }

  static styles: CSSResult[] = [
    ...super.styles as CSSResult[],
    css`
      :host sl-dialog::part(base) {
        z-index: 100;
      }

      #main::part(panel) {
        border-radius: calc(1px * var(--nh-radii-xl));
        background-color: var(--nh-theme-bg-surface); 
        max-height: 16rem;
        --sl-shadow-x-large: 2px -1px var(--nh-theme-bg-backdrop);
      }
      
      @media (max-height: 767px) {
        .container {
          justify-content: center;
          display: flex;
        }
      }

      #main.medium::part(panel) {
        min-height: 33vh;
        max-height: 90vh;
        min-width: 50vw;
      }

      #main.large::part(panel) {
        min-height: 90vh;
        min-width: 95vw;
      }

      #main.large::slotted(*) {
        min-height: 80vh;
        overflow-y: auto;
      }
      
      #main.medium::slotted(div) {
        min-height: 90vh;
      }

      #main.large::slotted(div) {
        min-height: 80vh;
      }

      #main::part(overlay),
      #main::part(base) {
        transition: opacity 1s ease-in-out;
      }

      #main::part(body),
      #main::part(footer),
      #main::part(header) {
        overflow: hidden;
        display: flext;
        justify-content: flex-start;
        padding: calc(1px * var(--nh-spacing-md));
        align-items: flex-start;
      }
      #main::part(body) {
        overflow-y: auto !important;
      }
      
      #main::part(title) {
        text-transform: uppercase;
        font-weight: var(--nh-font-weights-body-bold);
        font-family: var(--nh-font-families-headlines);
        padding: calc(1px * var(--nh-spacing-sm));
        color: var(--nh-theme-fg-muted);
      }

      :host(.no-title) #main::part(title) {
        height: 0;
      }

      #main::part(title) {
        font-size: calc(1px * var(--nh-font-size-sm));
        letter-spacing: 0.5px;
      }

      #main::part(close-button) {
        display: none;
      }

      /* Form type */
      
      #main.input-form::part(panel) {
        min-width: 24rem;
      }

      #main.input-form.large::part(panel) {
        min-width: 90%;
      }

      #main.input-form::part(header) {
        height: 1px;
      }

      #main.input-form::part(footer) {
        height: 4.5rem;
        justify-content: flex-end;
        align-items: center;
        padding-right: 20px;
      }

      ::slotted(div), #buttons {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: padding: calc(1px * var(--nh-spacing-md));
      }

      #buttons {
        justify-content: flex-end;
      }

      #primary-action-button::part(base), #secondary-action-button::part(base) {
        border-radius: calc(1px * var(--nh-radii-md));
        background-color: var(--nh-theme-bg-surface);
        color: var(--nh-theme-fg-default);
        font-weight: 500;
        width: calc(1rem * var(--nh-spacing-sm));
        border: none;
      }

      #secondary-action-button {
        margin-right: calc(1px * var(--nh-spacing-md));
      }

      #primary-action-button::part(base) {
        background-color: var(--nh-theme-bg-detail);
      }
    `,
  ];
}
