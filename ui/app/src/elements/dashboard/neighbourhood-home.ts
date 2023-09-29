import { contextProvided } from "@lit-labs/context";
import { html, css, CSSResult } from "lit";

import { matrixContext, weGroupContext } from "../../context";
import { MatrixStore } from "../../matrix-store";

import { query, state } from "lit/decorators.js";
import { NHButton, NHCard, NHComponentShoelace, NHDialog, NHPageHeaderCard } from '@neighbourhoods/design-system-components';
import { SlTooltip } from "@scoped-elements/shoelace";
import { InvitationsBlock } from "../components/invitations-block";
import { AppletLibrary } from "../components/applet-library";
import { TaskSubscriber } from "lit-svelte-stores";
import { DnaHash, EntryHash } from "@holochain/client";
import { NeighbourhoodSettings } from "./neighbourhood-settings";

export class NeighbourhoodHome extends NHComponentShoelace {
  @contextProvided({ context: matrixContext, subscribe: true })
  _matrixStore!: MatrixStore;

  @contextProvided({ context: weGroupContext, subscribe: true })
  weGroupId!: DnaHash;
  
  _neighbourhoodInfo = new TaskSubscriber(
    this,
    () => this._matrixStore.fetchWeGroupInfo(this.weGroupId),
    () => [this._matrixStore, this.weGroupId]
  );

  @state()
  private _showLibrary: boolean = false; 
  
  @state()
  private _showInstallScreen: boolean = false;

  @state()
  private _installAppletId: EntryHash | undefined;

  @state()
  private _installMode: "reinstall" | "join" = "join";

  render() {
    return this._showLibrary
      ? html`
            <div class="container">
              <applet-library .toggleVisible=${() => { this._showLibrary = false }}></applet-library>
            </div>
        `
      : html`
            <div class="container">
              <div class="nh-image">
                ${this._neighbourhoodInfo.value
                  ? html`<img
                      class="logo-large"
                      src=${this._neighbourhoodInfo.value.logoSrc}
                    />`
                  : null }
                <h1>
                  ${this._neighbourhoodInfo.value?.name}
                </h1>
              </div>

              <div class="card-block">
                <invitations-block></invitations-block>

                <nh-card .theme=${"dark"} .title=${""} .heading=${"Add new applet"} .textSize=${"sm"} .hasPrimaryAction=${true}>
                  <p>
                    Initiate a new Applet instance from scratch that other neighbourhood members will be able to join.
                  </p>
                  <div slot="footer">
                    <nh-button label="Browse Applets" .variant=${"primary"} .clickHandler=${() => this._showLibrary = true} .size=${"stretch"}></nh-button>
                  </div>
                </nh-card>  
              </div>
              <neighbourhood-settings class="settings"
                @join-applet=${(e: CustomEvent) => {
                  this._installAppletId = e.detail;
                  this._installMode = "join";
                  this._showInstallScreen = true;
                  }
                }
                @reinstall-applet=${(e: CustomEvent) => {
                  this._installAppletId = e.detail;
                  this._installMode = "reinstall";
                  this._showInstallScreen = true;
                  }
                }
              >
                <div class="to-join"></div>
                <div class="installed"></div>
                <div class="uninstalled"></div>
                <div class="danger-zone"></div>
              </neighbourhood-settings>
            </div>
    `
  }


  static elementDefinitions = {
      'nh-page-header-card': NHPageHeaderCard,
      "nh-button": NHButton,
      "nh-card": NHCard,
      'nh-dialog': NHDialog,
      "applet-library": AppletLibrary,
      "invitations-block": InvitationsBlock,
      "neighbourhood-settings": NeighbourhoodSettings,
      "sl-tooltip": SlTooltip,
  }

  static styles : CSSResult[] = [
    super.styles as CSSResult,
      css`
        /** Layout **/
        
        :host {
          display: flex;
        }

        .container {
          flex: 1;
          display: grid;
          gap: calc(1px * var(--nh-spacing-sm));
          padding: calc(1px * var(--nh-spacing-3xl));
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto;
          grid-template-areas:  "nh-image card-block"
                                "nh-settings nh-settings";
        }
        .nh-image { grid-area: nh-image; align-self: center; }
        .card-block { grid-area: card-block; align-self: center; }
        .settings { grid-area: nh-settings; display: flex; flex-direction: column;}
        applet-library { grid-column: -1/1; grid-row: -1/1; }
        
        /** Sub-Layout **/
        .to-join, .installed, .uninstalled, .danger-zone { 
          display: flex;
          flex: 1;
        }

        .nh-image {
          display: grid;
          place-content: center
        }

        .card-block {
          display: flex;
          flex-direction: column;
          gap: calc(1px * var(--nh-spacing-3xl));
        }
        
        .logo-large {
          width: 200px;
          height: 200px;
          border-radius: 100%;
        }

        /** Typo **/
        h1 {
          text-align: center;
        }
    `
  ];
}

// .container > * {
//   background-color: var(--nh-theme-bg-surface); 
// }