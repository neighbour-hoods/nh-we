import { classMap } from 'lit/directives/class-map.js';
import { css, CSSResult, html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { NHComponent } from './ancestors/base';

export default class NHTooltip extends NHComponent {
  @property()
  text: string = "Tooltip Text";
  @property()
  visible: boolean = true;
  @property()
  variant: "primary"
  | "success"
  | "neutral"
  | "warning"
  | "danger" = "success";

  render() : TemplateResult {
    return html`
      <div class="tooltip${classMap({
        visible: this.visible,
      })}">
        <slot name="hoverable" class="hoverable">Hover</slot>
        <div class="content">
        <svg class="icon${classMap({
            [this.variant]: this.variant,
          })}" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 6.47715 6.47715 2 12 2C17.5229 2 22 6.47715 22 12C22 17.5229 17.5229 22 12 22C6.47715 22 2 17.5229 2 12ZM4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12ZM12.7071 15.2929C13.0976 15.6834 13.0976 16.3166 12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071C10.9024 16.3166 10.9024 15.6834 11.2929 15.2929C11.6834 14.9024 12.3166 14.9024 12.7071 15.2929ZM11 8C11 7.44771 11.4477 7 12 7C12.5523 7 13 7.44772 13 8V13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13V8Z" fill="currentColor"/>
        </svg>
        ${this.text}
        </div>
      </div>
    `;
  }

  static styles: CSSResult[] = [
    super.styles as CSSResult,
    css`
      /* Tooltip container */
      .tooltip {
        position: relative;
        display: inline-block;
        height: fit-content;
        width: fit-content;
      }
      
      /* Tooltip text */
      .tooltip .content {
        line-height: var(--nh-line-heights-body-relaxed);
        font-family: var(--nh-font-families-headlines);
        font-size: calc(1px * var(--nh-font-size-sm));
        font-weight: var(--nh-font-weights-body-regular);

        background-color: var(--nh-theme-bg-element); 
        border: 1px solid var(--nh-theme-accent-disabled);
        color: var(--nh-theme-fg-default); 

        visibility: hidden;
        z-index: 1;
        position: absolute;
        top: 105%;
        right: 0%;
        width: fit-content;

        text-align: left;
        padding: 4px 8px 8px 8px;
        box-sizing: border-box;
        border-radius: 8px;
      }
      
      /* Show the tooltip text when you mouse over the tooltip container */
      .visible .hoverable:hover + .content {
        visibility: visible;
      }

      :host(.extend) .tooltip .content {
        width: 150%;
      }

      :host(.super-extend) .tooltip .content { 
        width: 40rem;
        right: 140%;
        padding: 8px;
        top: -1rem;
      }

      .tooltip .content::after {
        content: " ";
        position: absolute;
        bottom: 100%;  /* At the top of the tooltip */
        right: 2%;
        z-index: 2;
        margin-left: -5px;
        border-width: 7px;
        border-style: solid;
        border-color: transparent transparent var(--nh-theme-accent-disabled) transparent;
      }
      
      /* Temp right tooltip, TODO: needs cleaning up */
      :host(.right) .tooltip .content {
        bottom: initial;
        top: 25%;
        left: 110%;
        padding: 4px 8px;
        min-width: 8rem;
      }
      :host(.left) .tooltip .content {
        bottom: initial;
        top: 25%;
        right: 110%;
        padding: 4px 8px;
        min-width: 8rem;
      }
      :host(.left) .tooltip .content::after {
        right: -.75rem;
        bottom: 34%;
        transform: rotate(90deg);
      }

      :host(.no-icon) .tooltip .content svg {
        display: none;
      }
      
      :host(.right) .tooltip .content::after {
        left: -0.5rem;
        right: initial;
        bottom: 34%;
        transform: rotate(-90deg);
      }

      .icon {
        position: relative;
        top: 7px;
        padding-right: 4px;
      }

      .icon.danger {
        color: var(--nh-theme-error-default);
      }

      .icon.success {
        color: var(--nh-theme-success-default);
      }

      .icon.primary {
        color: var(--nh-theme-accent-default);
      }

      .icon.warning {
        color: var(--nh-theme-warning-default);
      }
    `,
  ];
}