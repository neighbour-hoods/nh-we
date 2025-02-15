import { ScopedRegistryHost } from "@lit-labs/scoped-registry-mixin"
import { css, html, LitElement } from "lit";
import { sharedStyles } from "../../sharedStyles";

export class AppletNotRunning extends ScopedRegistryHost(LitElement) {

  render() {
    return html`
      <div class="flex-scrollable-parent">
        <div class="flex-scrollable-container">
          <div class="flex-scrollable-y">
            <div
              class="column center-content"
              style="flex: 1; margin-top: 50px; padding: 24px;">
              <div
                style="margin-top: 70px; font-size: 1.5em; text-align: center;">
                This applet is not running.
              </div>
              <div
                style="margin-top: 70px; font-size: 1.2em; text-align: center; max-width: 700px; line-height: 1.7">
                Go to the <strong>Neighbourhood Settings</strong> <em>settings</em> of the neighbourhood in which this applet is installed to boot it up again.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static get styles() {
    const localStyles = css`
      :host {
        display: flex;
      }
    `;

    return [sharedStyles, localStyles];
  }


}
