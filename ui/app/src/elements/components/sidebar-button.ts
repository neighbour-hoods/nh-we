import { ScopedRegistryHost } from "@lit-labs/scoped-registry-mixin"
import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";

import NHTooltip from '@neighbourhoods/design-system-components/tooltip';

export class SidebarButton extends ScopedRegistryHost(LitElement) {

  @property()
  logoSrc!: string;

  @property()
  tooltipText!: string;

  @property()
  placement: "top" | "top-start" | "top-end" | "right" | "right-start" | "right-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" = "right";

  private handleClick(e: any) {
    this.dispatchEvent(
      new Event("click", {
        composed: true,
        bubbles: true,
      })
    );
  }

  render() {
    return this.tooltipText
      ? html`
        <nh-tooltip .text=${this.tooltipText} class="right no-icon">
          <img slot="hoverable" class="icon" src="${this.logoSrc}" @click=${this.handleClick} />
        </nh-tooltip>
      `
      : html`<img slot="hoverable" class="icon" src="${this.logoSrc}" @click=${this.handleClick} />`;
  }

  static get elementDefinitions() {
    return {
      "nh-tooltip": NHTooltip,
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        overflow: visible;
      }
      .icon {
        cursor: pointer;
        width: 50px;
        height: 50px;
        border-radius: .5rem;
        object-fit: cover;
        transform: scale(1.2);
      }
    `;
  }
}
