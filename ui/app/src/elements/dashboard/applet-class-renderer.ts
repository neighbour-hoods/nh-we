import { EntryHash } from "@holochain/client";
import { contextProvided } from "@lit-labs/context";
import { Task } from "@lit-labs/task";
import { ScopedRegistryHost as ScopedElementsMixin } from "@lit-labs/scoped-registry-mixin"
import { CircularProgress } from "@scoped-elements/material-web";
import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { matrixContext } from "../../context";
import { MatrixStore } from "../../matrix-store";
import { sharedStyles } from "../../sharedStyles";
import { NoMergeEyeView } from "./no-merge-eye-view";
import { RenderBlock } from "../components/render-block";

const sleep = (ms: number) => new Promise((r) => setTimeout(() => r(null), ms));

export class AppletClassRenderer extends ScopedElementsMixin(LitElement) {

  @contextProvided({ context: matrixContext, subscribe: true })
  _matrixStore!: MatrixStore;

  @property()
  appletClassId!: EntryHash;

  _rendererTask = new Task(
    this,
    async () => {
      await sleep(1);
      return this._matrixStore.fetchAppletClassRenderers(this.appletClassId);
    },
    () => [this._matrixStore, this.appletClassId]
  );


  render() {
    return this._rendererTask.render({
      pending: () => html`
        <div class="row center-content" style="flex: 1;">
          <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>
      `,
      complete: (renderer) => {
        const mergeEyeView = renderer.blocks.find(
          (renderBlock) => renderBlock.name === "merge-eye-view"
        );

        return mergeEyeView
          ? html`
              <render-block
                .renderer=${mergeEyeView.render}
                style="flex: 1"
              ></render-block>
            `
          : html`<no-merge-eye-view style="flex: 1;" .appletClassId=${this.appletClassId}></no-merge-eye-view>`
      }
    });
  }


  static get scopedElements() {
    return {
      "render-block": RenderBlock,
      "mwc-circular-progress": CircularProgress,
      "no-merge-eye-view": NoMergeEyeView,
    };
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        position: relative;
      }
    `,
  ];

}
