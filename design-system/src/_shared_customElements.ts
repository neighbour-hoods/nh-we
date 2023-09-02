/**
 * Workaround import for cross-dependencies between stories.
 *
 * CustomElement registration for components shared between stories needs to be done exactly once.
 */

import NHButton from "./button";
import NHCard from "./card";
import NHPageHeaderCard from './page-header-card'
import NHTabButton from "./tab-button";

let loaded = false
if (!loaded) {
  customElements.define('nh-button', NHButton)
  customElements.define('nh-card', NHCard)
  customElements.define('nh-tab-button', NHTabButton)
  customElements.define('nh-page-header-card', NHPageHeaderCard)
  loaded = true
}
