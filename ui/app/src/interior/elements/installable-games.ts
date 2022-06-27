import { html, LitElement, css } from "lit";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { ListProfiles } from "@holochain-open-dev/profiles";
import {
  Button,
  TextField,
  CircularProgress,
  Card,
} from "@scoped-elements/material-web";
import { contextProvided } from "@lit-labs/context";
import { AgentPubKeyB64, EntryHashB64 } from "@holochain-open-dev/core-types";
import { query, state } from "lit/decorators.js";
import { Task } from "@lit-labs/task";

import { sharedStyles } from "../../sharedStyles";
import { WeStore } from "../we-store";
import { weContext } from "../context";
import {
  AppWithReleases,
  getAllPublishedApps,
  getLatestRelease,
} from "../../processes/devhub/get-happs";

import { GameInfo } from "../types";
import { CreateGameDialog } from "./create-game-dialog";
import { TaskSubscriber } from "lit-svelte-stores";

export class InstallableGames extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: weContext, subscribe: true })
  @state()
  _weStore!: WeStore;

  _installableGames = new Task(
    this,
    async ([s]) => {
      const devhubHapp = await this._weStore.getDevhubHapp();

      return getAllPublishedApps(this._weStore.appWebsocket, devhubHapp);
    },
    () => [this._weStore]
  );

  @state()
  private _selectedGameInfo: GameInfo | undefined;

  @query("#game-dialog")
  _gameDialog!: CreateGameDialog;

  renderInstallableGame(gameInfo: GameInfo) {
    return html`
      <mwc-card class="game-card">
        <div style="height: 145px;">
          <h2 style="padding: 5px; margin:0;">${gameInfo.title}</h2>
          <h3 style="padding: 5px; margin: 0;">${gameInfo.subtitle}</h3>
          <div style="height: 70px; overflow-y: auto; padding: 5px;">
            ${gameInfo.description}
          </div>
        </div>
        <mwc-button
          outlined
          @click=${() => {
            this._gameDialog.open(gameInfo);
          }}
          >INSTALL</mwc-button
        >
      </mwc-card>
    `;
  }

  renderGames(games: Array<AppWithReleases>) {
    return html` <create-game-dialog
        id="game-dialog"
        .gameInfo=${this._selectedGameInfo}
        @closed=${() => {
          this._selectedGameInfo = undefined;
        }}
      ></create-game-dialog>

      <div class="flex-scrollable-y" style="display: flex; flex-wrap: wrap; max-height: 500px;">
        ${(games.length == 0)
          ? html`
            <div class="column" style="align-items: center;">
              <div class="row center-content default-font" style="font-size: 1.em; text-align: center; margin-top: 20px;">No hApps available yet <mwc-icon style="margin-left: 10px;">mood_bad</mwc-icon></div>
            </div>
            `
          : games.map((item) => {
              let latestRelease = getLatestRelease(item);

              if (latestRelease) {
                let gameInfo: GameInfo = {
                  title: item.app.content.title,
                  subtitle: item.app.content.subtitle,
                  description: item.app.content.description,
                  icon: undefined, // ADD ICON HERE
                  entryHash: latestRelease.address,
                };
                return this.renderInstallableGame(gameInfo);
              }
            })
          }
      </div>
      `;
  }

  render() {
    return this._installableGames.render({
      complete: (games) => this.renderGames(games),
      pending: () => html`
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      `,
    });
  }

  static get scopedElements() {
    return {
      "list-profiles": ListProfiles,
      "mwc-button": Button,
      "mwc-textfield": TextField,
      "mwc-circular-progress": CircularProgress,
      "mwc-card": Card,
      "create-game-dialog": CreateGameDialog,
    };
  }

  static localStyles = css`
    .game-card {
      width: 300px;
      height: 180px;
      margin: 10px;
    }
  `;

  static get styles() {
    return [sharedStyles, this.localStyles];
  }
}
