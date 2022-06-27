import { css, html, LitElement } from "lit";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { ListProfiles } from "@holochain-open-dev/profiles";
import {
  Button,
  TextField,
  Snackbar,
  CircularProgress,
} from "@scoped-elements/material-web";
import { contextProvided } from "@lit-labs/context";
import { AgentPubKeyB64, EntryHashB64 } from "@holochain-open-dev/core-types";
import { query, state, property } from "lit/decorators.js";

import { sharedStyles } from "../../sharedStyles";
import { WeStore } from "../we-store";
import { weContext } from "../context";
import { RenderBlock } from "./render-block";
import { Renderer } from "@lightningrodlabs/we-game";
import { Task } from "@lit-labs/task";

export class WeGameRenderer extends ScopedElementsMixin(LitElement) {
  @contextProvided({ context: weContext, subscribe: true })
  @state()
  _store!: WeStore;

  @state()
  _pubKey: AgentPubKeyB64 | undefined;

  @property()
  gameHash!: EntryHashB64;

  _rendererTask = new Task(
    this,
    () => this._store.fetchGameRenderers(this.gameHash),
    () => [this._store, this.gameHash]
  );

  render() {
    return this._rendererTask.render({
      pending: () => html`
        <div class="center-content">
          <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>
      `,
      complete: (renderer) =>
        html` <render-block .renderer=${renderer.full}></render-block> `,
    });
  }

  static get scopedElements() {
    return {
      "render-block": RenderBlock,
      "mwc-circular-progress": CircularProgress,
    };
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        position: relative;
      }
    `,
  ];
}
