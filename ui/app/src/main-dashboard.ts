import { ConfigureAppletDimensions } from './elements/dialogs/configure-applet-dimensions-dialog';
import { consume } from '@lit/context';
import { state, query, queryAsync, property } from 'lit/decorators.js';
import { DnaHash, EntryHash, decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
import { html, css, CSSResult, unsafeCSS, LitElement, PropertyValueMap } from 'lit';
import { StoreSubscriber } from 'lit-svelte-stores';
import { classMap } from 'lit/directives/class-map.js';
import { matrixContext } from './context';
import { MatrixStore } from './matrix-store';
import { sharedStyles } from './sharedStyles';
import { HomeScreen } from './elements/dashboard/home-screen';
import { get } from 'svelte/store';
import { AppletInstanceInfo, DashboardMode, NavigationMode, WeGroupInfo } from './types';
import { SidebarButton } from './elements/components/sidebar-button';
import { CreateNeighbourhoodDialog } from './elements/dialogs/create-nh-dialog';
import { WeGroupContext } from './elements/we-group-context';
import { NeighbourhoodHome } from './elements/dashboard/neighbourhood-home';
import { AppletInstanceRenderer } from './elements/dashboard/applet-instance-renderer';
import { AppletNotInstalled } from './elements/dashboard/applet-not-installed';
import { NotificationDot } from './elements/components/notification-dot';
import { InactiveOverlay } from './elements/components/inactive-overlay';
import { AppletIconBadge } from './elements/components/applet-icon-badge';
import { getStatus } from '@neighbourhoods/app-loader';
import { AppletNotRunning } from './elements/dashboard/applet-not-running';
import { IconDot } from './elements/components/icon-dot';
import { WithProfile } from './elements/components/profile/with-profile';
import { provideMatrix } from './matrix-helpers.js';
import { NHGlobalConfig } from './nh-config';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';

import NHButton from '@neighbourhoods/design-system-components/button';
import NHSpinner from '@neighbourhoods/design-system-components/spinner';
import NHTooltip from '@neighbourhoods/design-system-components/tooltip';
import NHDialog from '@neighbourhoods/design-system-components/dialog';
import NHProfileCard from '@neighbourhoods/design-system-components/profile/profile-card';
import { b64images } from '@neighbourhoods/design-system-styles';
import { ConfigPage } from './nh-config/types';
import { AppletConfigInput, SensemakerStore } from '@neighbourhoods/client';
import { alertEvent } from './decorators/alert-event';

export class MainDashboard extends ScopedRegistryHost(LitElement) {
  @consume({ context: matrixContext , subscribe: true })
  @property({attribute: false})
  _matrixStore!: MatrixStore;

  // :SHONK: not accessed, only used to call `matrixStore.fetchMatrix` to populate below Readables
  _matrix = new StoreSubscriber(
    this,
    () => provideMatrix(this._matrixStore),
    () => [this._matrixStore],
  );

  _allWeGroupInfos = new StoreSubscriber(this, () => this._matrixStore.weGroupInfos());

  @query('#sensemaker-dashboard')
  _sensemakerDashboard!: NHGlobalConfig;
  @queryAsync('#nh-home')
  _neighbourhoodHome;

  @alertEvent() success 
  /**
   * Defines the content of the dashboard
   */
  @state()
  private _dashboardMode: DashboardMode = DashboardMode.MainHome;

  /**
   * Defines the content of the navigation panels (left sidebar (primary) and top bar (secondary))
   */
  @state()
  private _navigationMode: NavigationMode = NavigationMode.Agnostic;

  @state()
  private _selectedWeGroupId: DnaHash | undefined; // DNA hash of the selected we group

  @state()
  private _selectedAppletInstanceId: EntryHash | undefined; // hash of the Applet's entry in group's we dna of the selected Applet instance

  
  @query('#open-create-nh-dialog') _createNHDialogButton!: HTMLElement;
  
  @query('configure-applet-dimensions-dialog') _configureAppletDimensionsDialog!: ConfigureAppletDimensions;
  @state() private _currentlyConfiguringAppletEh!: EntryHash | undefined;
  @state() private _currentlyConfiguringAppletConfig!: AppletConfigInput | undefined;

  @query('#component-card')
  _withProfile!: any;

  @state() haveCreatedDimensions: boolean = false;
  @state() userProfileMenuVisible: boolean = false;

  async updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    // Cache appInfo here to prevent cachedAppInfo issue (sensemaker.0 cell could not be found)
    this._selectedWeGroupId && this._matrixStore?.sensemakerStore(this._selectedWeGroupId).subscribe(s => {(s as SensemakerStore).client.appInfo(); console.log("Cached appInfo!")});

    if(changedProperties.has('_selectedAppletInstanceId') && !!this._selectedWeGroupId && !!this._selectedAppletInstanceId) {
        if(this.haveCreatedDimensions) {
          this.haveCreatedDimensions = false;
          // No need to reassign applet info to local state
          return;
        }
        const appletInstanceInfo = this._matrixStore.getAppletInstanceInfo(this._selectedAppletInstanceId!);
        if(typeof appletInstanceInfo == 'undefined') return;
        const applet = appletInstanceInfo?.applet;
        
        const config = await this._matrixStore.queryAppletGui(applet!.devhubHappReleaseHash)
        this._currentlyConfiguringAppletConfig = config.appletConfig;
      }
    }

  async refreshProfileCard(weGroupId: DnaHash) {
    if(!this._withProfile?.agentProfile?.value) {
      console.warn("Unable to refresh profile card")
      return;
    }

    this._withProfile.refreshed = true;
    this._withProfile.weGroupId = weGroupId;
    await this._withProfile.requestUpdate("agentProfile");
    await this._withProfile.updateComplete;
  }

  toggleUserMenu () {
    this.userProfileMenuVisible = !this.userProfileMenuVisible;
    (this.renderRoot.querySelector(".user-profile-menu .context-menu") as HTMLElement).dataset.open = 'true';
  }

  renderPrimaryNavigation() {
    // show all we groups in weGroup mode
    return this.renderWeGroupIconsPrimary([...this._allWeGroupInfos.value.values()]);
  }

  renderSecondaryNavigation() {
    if (this._navigationMode === NavigationMode.GroupCentric) {
      const appletInstanceInfos = get(
        this._matrixStore.getAppletInstanceInfosForGroup(this._selectedWeGroupId!),
      );
      return html`
        ${appletInstanceInfos ? this.renderAppletInstanceList(appletInstanceInfos) : html``}

        <nav id="sensemaker-buttons">
          <nh-tooltip class="left no-icon" .text=${"Add Applet"}>
            <button slot="hoverable" class="applet-add" @click=${async () => {this._dashboardMode = DashboardMode.WeGroupHome; (await this._neighbourhoodHome).showLibrary();}}></button>
          </nh-tooltip>
          <nh-tooltip class="left no-icon" .text=${"Dashboard"}>
            <button
              slot="hoverable"
              class="dashboard-icon"
              @click=${() => {
                this._selectedAppletInstanceId = undefined;
                this._dashboardMode = DashboardMode.NHGlobalConfig;
              }}
            ></button>
          </nh-tooltip>
        </nav>
      `;
      // show all applet classes in NavigationMode.Agnostic
    } else {
      return html``;
    }
  }

  renderDashboardContent() {
    if (this._dashboardMode === DashboardMode.MainHome) {
      return html` <home-screen style="display: flex; flex: 1;"></home-screen> `;
    } else if (this._dashboardMode === DashboardMode.NHGlobalConfig) {
      return html`
        <we-group-context .weGroupId=${this._selectedWeGroupId} @return-home=${() =>{
          this._dashboardMode = DashboardMode.WeGroupHome;
        }}>
          <nh-global-config></nh-global-config>
        </we-group-context>
      `
    } else if (!!this._selectedWeGroupId && this._dashboardMode === DashboardMode.WeGroupHome) {
      return html`
        <we-group-context .weGroupId=${this._selectedWeGroupId}>
          <nh-home
            style="display: flex; flex: 1;"
            id="nh-home"
            @applet-installed=${(e: CustomEvent) => {this.openConfigureAppletDimensionsDialog(); this.handleAppletInstalledNotYetConfigured(e)}}
          >
          </nh-home>
        </we-group-context>
      `;
    } else if (this._dashboardMode === DashboardMode.DashboardOverview) {
      return html`
        <we-group-context .weGroupId=${this._selectedWeGroupId}>
          <nh-global-config id="sensemaker-dashboard"> </nh-global-config>
        </we-group-context>
      `;
    } else if (this._dashboardMode === DashboardMode.AppletGroupInstanceRendering) {
      return html`
        <we-group-context .weGroupId=${this._selectedWeGroupId}>
          ${this.renderAppletInstanceContent()}
        </we-group-context>
      `;
    } else if (this._dashboardMode === DashboardMode.Loading) {
      return html`<nh-spinner type=${"page"}></nh-spinner>`;
    }
  }

  renderAppletInstanceContent() {
    // 1. check whether the selected applet instance is already installed
    if (this._matrixStore.isInstalled(this._selectedAppletInstanceId!)) {
      return getStatus(this._matrixStore.getAppletInstanceInfo(this._selectedAppletInstanceId!)!.appInfo) === "RUNNING"
      ? html`
        <applet-instance-renderer
          style="display: flex; flex: 1; background: var(--nh-theme-fg-muted); height: 0;"
          .appletInstanceId=${this._selectedAppletInstanceId}
        >
        </applet-instance-renderer>
      `
      : html`<applet-not-running style="display: flex; flex: 1;"></applet-not-running>`
    } else {
      return html`
        <applet-not-installed
          @applet-installed=${(e: CustomEvent) => {this.openConfigureAppletDimensionsDialog(); this.handleAppletInstalledNotYetConfigured(e)}}
          style="display: flex; flex: 1;"
          .appletInstanceId=${this._selectedAppletInstanceId}
        >
        </applet-not-installed>
      `;
    }
  }

  async handleWeGroupIconPrimaryClick(weGroupId: DnaHash) {
    this._navigationMode = NavigationMode.GroupCentric;
    if (this._selectedWeGroupId !== weGroupId) {
      this._selectedAppletInstanceId = undefined;
    }
    this._dashboardMode = DashboardMode.WeGroupHome;
    this._selectedWeGroupId = weGroupId;

    this._currentlyConfiguringAppletEh = undefined;
    this._currentlyConfiguringAppletConfig = undefined;

    await this._matrixStore.initializeStateForGroup(weGroupId);

    await this.refreshProfileCard(weGroupId);
  }

  handleWeGroupIconSecondaryClick(weGroupId: DnaHash, appletId: EntryHash) {
    this._selectedWeGroupId = weGroupId;
    this._selectedAppletInstanceId = appletId;
    this._dashboardMode = DashboardMode.AppletGroupInstanceRendering;
  }

  handleNewAppletInstanceIconClick(appletId: EntryHash) {
    this._selectedAppletInstanceId = appletId;
    this._dashboardMode = DashboardMode.AppletGroupInstanceRendering;
  }

  /**
   * Renders the We Group Icons if they are to be shown in the primary navigational panel
   * @param weGroups
   * @returns
   */
  renderWeGroupIconsPrimary(weGroups: WeGroupInfo[]) {
    return html`${weGroups.length > 0
        ? html` <div
            style="display:flex; flex-direction: column; gap: calc(1px * var(--nh-spacing-sm))"
          >
            ${weGroups
              .sort((a, b) => a.info.name.localeCompare(b.info.name))
              .map(
                weGroupInfo =>
                  html`
                    <sidebar-button
                      style="margin-top: 2px; margin-bottom: 2px;"
                      .logoSrc=${weGroupInfo.info.logoSrc}
                      .tooltipText=${weGroupInfo.info.name}
                      @click=${async () => {
                        console.log("clicked to enter group!");
                        await this.handleWeGroupIconPrimaryClick(weGroupInfo.dna_hash);
                        this.requestUpdate();
                      }}
                      class=${classMap({
                        highlightedGroupCentric:
                          JSON.stringify(weGroupInfo.dna_hash) ===
                          JSON.stringify(this._selectedWeGroupId),
                        groupCentricIconHover:
                          JSON.stringify(weGroupInfo.dna_hash) !=
                          JSON.stringify(this._selectedWeGroupId),
                      })}
                    ></sidebar-button>
                  `,
              )}
          </div>`
        : html`<div id="placeholder"></div>`}

      <nh-tooltip class="right no-icon" .text=${"Add Neighbourhood"}>
        <button slot="hoverable" id="open-create-nh-dialog" class="group-add"></button>
      </nh-tooltip> `;
  }

  /**
   * Renders the We Group Icons if they are to be shown in the secondary navigational panel
   * @param weGroups
   * @returns
   */
  renderWeGroupIconsSecondary(info: [WeGroupInfo, AppletInstanceInfo][]) {
    return html`
      ${info
        .sort(([weGroupInfo_a, appletInstanceInfo_a], [weGroupInfo_b, appletInstanceInfo_b]) => {
          // sort by group name and applet instance name
          if (weGroupInfo_a.info.name === weGroupInfo_b.info.name) {
            return appletInstanceInfo_a.applet.customName.localeCompare(
              appletInstanceInfo_b.applet.customName,
            );
          } else {
            return weGroupInfo_a.info.name.localeCompare(weGroupInfo_b.info.name);
          }
        })
        .map(([weGroupInfo, appletInstanceInfo]) => {
          return getStatus(appletInstanceInfo.appInfo) === 'RUNNING'
            ? html`
                <icon-dot icon="share" invisible=${appletInstanceInfo.federatedGroups.length === 0}>
                  <applet-icon-badge .logoSrc=${appletInstanceInfo.applet.logoSrc}>
                    <sidebar-button
                      placement="bottom"
                      style="overflow: hidden; margin-left: calc(1px * var(--nh-spacing-md)); margin-right: 2px; border-radius: 50%;"
                      .logoSrc=${weGroupInfo.info.logoSrc}
                      .tooltipText=${weGroupInfo.info.name +
                      ' - ' +
                      appletInstanceInfo.applet.customName}
                      @click=${() => {
                        this.handleWeGroupIconSecondaryClick(
                          weGroupInfo.dna_hash,
                          appletInstanceInfo.appletId,
                        );
                        this.requestUpdate();
                      }}
                      class=${classMap({
                        highlightedGroupCentric:
                          JSON.stringify(appletInstanceInfo.appletId) ===
                          JSON.stringify(this._selectedAppletInstanceId),
                        groupCentricIconHover:
                          JSON.stringify(appletInstanceInfo.appletId) !==
                          JSON.stringify(this._selectedAppletInstanceId),
                      })}
                    ></sidebar-button>
                  </applet-icon-badge>
                </icon-dot>
              `
            : html`
                <applet-icon-badge .logoSrc=${appletInstanceInfo.applet.logoSrc}>
                  <inactive-overlay>
                    <sidebar-button
                      placement="bottom"
                      style="overflow: hidden; margin-left: calc(1px * var(--nh-spacing-md)); margin-right: 2px; border-radius: 50%;"
                      .logoSrc=${weGroupInfo.info.logoSrc}
                      .tooltipText=${weGroupInfo.info.name +
                      ' - ' +
                      appletInstanceInfo.applet.customName +
                      ' (Disabled)'}
                      @click=${() => {
                        this.handleWeGroupIconSecondaryClick(
                          weGroupInfo.dna_hash,
                          appletInstanceInfo.appletId,
                        );
                        this.requestUpdate();
                      }}
                      class=${classMap({
                        highlightedGroupCentric:
                          JSON.stringify(appletInstanceInfo.appletId) ===
                          JSON.stringify(this._selectedAppletInstanceId),
                        groupCentricIconHover:
                          JSON.stringify(appletInstanceInfo.appletId) !==
                          JSON.stringify(this._selectedAppletInstanceId),
                      })}
                    ></sidebar-button>
                  </inactive-overlay>
                </applet-icon-badge>
              `;
        })}
    `;
  }

  renderAppletInstanceList(appletInstances: AppletInstanceInfo[]) {
    return appletInstances.length > 0
      ? html`<div style="display: flex;">
          ${appletInstances
            .sort((a, b) => a.applet.customName.localeCompare(b.applet.customName))
            .map(appletInstanceInfo => {
              return getStatus(appletInstanceInfo.appInfo) === 'RUNNING'
                ? html`
                    <icon-dot
                      icon="share"
                      invisible=${appletInstanceInfo.federatedGroups.length === 0}
                    >
                      <sidebar-button
                        placement="bottom"
                        style="margin-left: calc(1px * var(--nh-spacing-md)); margin-right: 2px; border-radius: 50%;"
                        .logoSrc=${appletInstanceInfo.applet.logoSrc}
                        .tooltipText=${appletInstanceInfo.applet.customName}
                        @click=${() => {
                          this._selectedAppletInstanceId = appletInstanceInfo.appletId;
                          this._dashboardMode = DashboardMode.AppletGroupInstanceRendering;
                          this.requestUpdate();
                        }}
                        class=${classMap({
                          highlightedAppletCentric:
                            JSON.stringify(appletInstanceInfo.appletId) ===
                            JSON.stringify(this._selectedAppletInstanceId),
                          appletCentricIconHover:
                            JSON.stringify(appletInstanceInfo.appletId) !=
                            JSON.stringify(this._selectedAppletInstanceId),
                        })}
                      >
                      </sidebar-button>
                    </icon-dot>
                  `
                : html``;
            })}
        </div>`
      : html`<span id="placeholder"></div>`;
  }

  handleWeGroupAdded(e: CustomEvent) {
    this._selectedWeGroupId = e.detail;
    this._selectedAppletInstanceId = undefined;
    this._dashboardMode = DashboardMode.WeGroupHome;
    this._navigationMode = NavigationMode.GroupCentric;
  }

  handleWeGroupLeft(e: CustomEvent) {
    this._selectedAppletInstanceId = undefined;
    this._selectedWeGroupId = undefined;
    this._dashboardMode = DashboardMode.MainHome;
    this._navigationMode = NavigationMode.Agnostic;
  }

  async openConfigureAppletDimensionsDialog() {
    this._configureAppletDimensionsDialog.dialog.showDialog()
  }

  async handleAppletInstalledNotYetConfigured(e: CustomEvent) {
    this._selectedAppletInstanceId = e.detail.appletEntryHash;
    const appletInstanceInfo = this._matrixStore.getAppletInstanceInfo(
      e.detail.appletEntryHash,
    );
    const applet = appletInstanceInfo?.applet;

    const config = await this._matrixStore.queryAppletGui(applet!.devhubHappReleaseHash)
    if(!config?.appletConfig?.dimensions) throw new Error("No applet dimensions found");
    this._currentlyConfiguringAppletEh = e.detail.appletEntryHash;
    this._currentlyConfiguringAppletConfig = config.appletConfig
  
  }

  async handleAppletInstalledAndDimensionsConfigured() {
    this._selectedAppletInstanceId = this._currentlyConfiguringAppletEh
    this.haveCreatedDimensions = true;
    this._dashboardMode = DashboardMode.AppletGroupInstanceRendering;
    this._navigationMode = NavigationMode.GroupCentric;

    this._currentlyConfiguringAppletEh = undefined;
    this._currentlyConfiguringAppletConfig = undefined;

    this.requestUpdate();
    await this.updateComplete;

    this.success.emit({
      title: "Applet Configured",
      msg: "Your applet's dimensions have been added and, if configured correctly, you should be able to make assessments."
    })
  }

  goHome() {
    this._selectedWeGroupId = undefined;
    this._selectedAppletInstanceId = undefined;
    this._dashboardMode = DashboardMode.MainHome;
    this._navigationMode = NavigationMode.Agnostic;
  }

  showLoading() {
    this._dashboardMode = DashboardMode.Loading;
    this.requestUpdate();
  }

  render() {
    return html`
      <create-nh-dialog
        @we-added=${e => {
          this.handleWeGroupAdded(e);
          this.refreshProfileCard(e.detail)
        }}
        @creating-we=${_e => this.showLoading()}
        id="create-nh-dialog"
        .openDialogButton=${this._createNHDialogButton}
      ></create-nh-dialog>
      
      ${this._selectedWeGroupId
        ? html`<we-group-context .weGroupId=${this._selectedWeGroupId}>
        <configure-applet-dimensions-dialog
            @configure-dimensions-manually=${() =>{
              this._dashboardMode = DashboardMode.DashboardOverview;
              if(this._sensemakerDashboard !== null) {
                this._sensemakerDashboard.page = ConfigPage.Dimensions
                this._sensemakerDashboard.requestUpdate()
              }
            }}
            .config=${this._currentlyConfiguringAppletConfig}
            .handleSubmit=${this.handleAppletInstalledAndDimensionsConfigured.bind(this)}
            id="configure-applet-dimensions-dialog"
        ></configure-applet-dimensions-dialog>
      </we-group-context>`
        : null
      }

      <div
        class="row"
        style="flex: 1"
        @we-group-joined=${e => this.handleWeGroupAdded(e)}
        @group-left=${e => this.handleWeGroupLeft(e)}
      >
        <div class="column">
          <div
            class="top-left-corner-bg ${classMap({
              tlcbgGroupCentric:
                this._navigationMode === NavigationMode.GroupCentric ||
                this._navigationMode == NavigationMode.Agnostic
            })}"
          ></div>
          <div class="column top-left-corner">
            <nh-tooltip .text=${"Home"} class="right no-icon">
              <div slot="hoverable" style="width: 72px; height: 72px;">
                <sidebar-button
                  id="nh-logo"
                  logoSrc="data:image/svg+xml;base64,${b64images.nhIcons.logoWhite}"
                  @click=${this.goHome}
                  class=${classMap({
                    highlightedHome: this._dashboardMode === DashboardMode.MainHome,
                    homeIconHover: this._dashboardMode !== DashboardMode.MainHome,
                  })}
                ></sidebar-button>
                <sidebar-button
                  id="nh-logo-col"
                  logoSrc="data:image/svg+xml;base64,${b64images.nhIcons.logoCol}"
                  @click=${this.goHome}
                  class=${classMap({
                    highlightedHome: this._dashboardMode === DashboardMode.MainHome,
                    homeIconHover: this._dashboardMode !== DashboardMode.MainHome,
                  })}
                ></sidebar-button>
              </div>
            </nh-tooltip>
          </div>

          <div
            class="
            column
            left-sidebar
            ${classMap({
              navBarGroupCentric:
                this._navigationMode === NavigationMode.GroupCentric ||
                this._navigationMode == NavigationMode.Agnostic
            })}"
            style="flex-basis: 100%; overflow: visible; display: grid; grid-template-rows: 1fr 82px 90px; align-items: flex-start; justify-items: center;"
          >
            ${this.renderPrimaryNavigation()}
            <div class="user-profile-menu">
              <nh-tooltip
              class="right no-icon"
                .text="${"Your Profile"}"
              >
                <button slot="hoverable" class="user-profile" type="button" @click=${() => {this.toggleUserMenu()}}></button>
              </nh-tooltip>
                ${this._selectedWeGroupId
                  ? html`
                    <we-group-context .weGroupId=${this._selectedWeGroupId}>
                      <with-profile id="component-card" .agentHash=${encodeHashToBase64(this._matrixStore.myAgentPubKey)} .component=${"card"} class="context-menu" data-open=${this.userProfileMenuVisible} @mouseleave=${() => {this.toggleUserMenu()}}>
                      </with-profile>
                    </we-group-context>`
                  : html`<div id="component-card" class="context-menu" data-open=${this.userProfileMenuVisible} @mouseleave=${() => {this.toggleUserMenu()}}>No profile</div>`
                }

            </div>
          </div>
        </div>

        <div class="column" style="flex: 1;">
          <div
            class="
            row
            top-bar
            ${classMap({
              navBarAppletCentric:
                this._navigationMode === NavigationMode.GroupCentric ||
                this._navigationMode == NavigationMode.Agnostic
            })}"
          >
            ${this.renderSecondaryNavigation()}
          </div>
          <div
            class="dashboard-content"
            style="flex: 1; width: 100%; display: flex;"
            @applet-installed=${async (e: CustomEvent) => {await this.handleAppletInstalledNotYetConfigured(e); await this.openConfigureAppletDimensionsDialog(); }}
          >
            ${this.renderDashboardContent()}
          </div>
        </div>
      </div>
    `;
  }

  static elementDefinitions = {
    'sidebar-button': SidebarButton,
    'create-nh-dialog': CreateNeighbourhoodDialog,
    'configure-applet-dimensions-dialog': ConfigureAppletDimensions,
    'home-screen': HomeScreen,
    'nh-tooltip': NHTooltip,
    'we-group-context': WeGroupContext,
    'nh-home': NeighbourhoodHome,
    'nh-dialog': NHDialog,
    'with-profile': WithProfile,
    'nh-button': NHButton,
    'nh-profile-card': NHProfileCard,
    'nh-global-config': NHGlobalConfig,
    "nh-spinner": NHSpinner,
    'applet-instance-renderer': AppletInstanceRenderer,
    'applet-not-installed': AppletNotInstalled,
    'notification-dot': NotificationDot,
    'icon-dot': IconDot,
    'inactive-overlay': InactiveOverlay,
    'applet-icon-badge': AppletIconBadge,
    'applet-not-running': AppletNotRunning,
  }

  static styles: CSSResult[] = [
    sharedStyles,
    // super.styles as CSSResult, // This adds inherited style from design-system-styles, generated from figma tokens.json. Removed as breaking change with Lit3 and we need to move to a mix-in pattern.
    css`
      :host {
        display: flex;
        overflow: hidden;
      }

      nav#sensemaker-buttons {
        display: flex;
        right: 16px;
        position: absolute;
        gap: calc(1px * var(--nh-spacing-lg));
      }

      .top-left-corner {
        align-items: center;
        background-color: transparent;
        height: 72px;
        width: 72px;
        z-index: 1;
      }

      .top-left-corner-bg {
        border-style: solid;
        border-width: 72px 0 0 72px;
        position: absolute;
        z-index: 0;
      }

      #nh-logo,
      #nh-logo-col {
        border-width: 0 !important;
        display: grid;
        place-content: center;
        height: 72px;
        width: 72px;
        position: absolute;
        overflow: initial;
        animation: none;
      }
      #nh-logo:hover {
        animation: crossfade 8s linear;
      }

      #nh-logo-col {
        z-index: 0;
      }

      #nh-logo {
        z-index: 1;
      }

      @keyframes crossfade {
        0% {opacity: 1; z-index:1}
        3% {opacity: 1;}
        6% {opacity: 0;}
        7% {opacity: 0; z-index:1}
        100% {opacity: 0; z-index:1}
      }

      .tlcbgGroupCentric {
        border-color: var(--nh-colors-eggplant-800);
      }

      .left-sidebar {
        overflow: hidden;
        width: 72px;
        padding-top: 16px;
        z-index: 1;
      }

      .navigation-switch-container {
        position: absolute;
        right: 0;
        top: 5rem;
      }

      .group-add,
      .user-profile,
      .dashboard-icon,
      .applet-add {
        width: 58px;
        height: 58px;
        margin-top: calc(2px * var(--nh-spacing-lg));
        margin-bottom: calc(1px * var(--nh-spacing-lg));
        cursor: pointer;
        border: none;
        position: relative;
        border: transparent 1px solid;
      }

      #nh-logo::after,
      .group-add::before,
      .user-profile::before,
      .applet-add::before,
      .dashboard-icon::before {
        content: '';
        background-image: url('data:image/svg+xml;base64,${unsafeCSS(b64images.nhIcons.divider)}');
        position: absolute;
        display: flex;
        justify-content: center;
        width: 69px;
        height: 2px;
      }
      .group-add::before,
      .user-profile::before {
        margin-bottom: calc(1px * var(--nh-spacing-lg));
        left: -7px;
        top: calc(-1px * var(--nh-spacing-lg) + 3px);
      }
      #nh-logo::after {
        margin-top: calc(1px * var(--nh-spacing-lg));
        left: 4px;
        bottom: calc(-1px * var(--nh-spacing-xs));
        z-index: 50;
      }
      .applet-add::before,
      .dashboard-icon::before {
        transform: rotate(-90deg);
        left: calc(-2px * var(--nh-spacing-lg) - 12px);
        bottom: 25px;
        margin: 0;
        filter: brightness(0.5);
      }
      .group-add,
      .applet-add {
        background: url('data:image/svg+xml;base64,${unsafeCSS(b64images.nhIcons.addApplet)}');
        background-size: contain;
        background-repeat: no-repeat;
      }
      .dashboard-icon,
      .applet-add {
        margin-top: 0;
        margin-bottom: 0;
      }

      user-profile-menu {
        display: relaive;
      }
      .user-profile {
        background: url('data:image/svg+xml;base64,${unsafeCSS(b64images.nhIcons.blankProfile)}');
        background-size: contain;
        background-repeat: no-repeat;
      }

      .context-menu {
        overflow: inherit;
        position: absolute;
        left: calc(72px + calc(1px * var(--nh-spacing-md)));
        bottom: calc(1px * var(--nh-spacing-md));
        transition: all 0.3s ease-in-out;
        border: 1px solid transparent;
        box-shadow: var(--nh-50);
      }
      .context-menu[data-open=true] {
        border: 1px solid var(--nh-theme-bg-muted);
        border-radius: calc(1px * var(--nh-radii-md));
      }
      .context-menu[data-open=false] {
        visibility: hidden;
        opacity: 0;
        transition: all 0.3s ease-in-out;
      }
      .dashboard-icon {
        background: url('data:image/svg+xml;base64,${unsafeCSS(b64images.nhIcons.dashboard)}');
        background-size: contain;
        background-repeat: no-repeat;
      }

      .top-bar {
        overflow: hidden;
        z-index: 0.5;
        display: grid;
        justify-items: start;
        align-items: center;
        grid-template-columns: 1fr 80px 80px;
      }

      .dashboard-content {
        background-color: var(--nh-theme-bg-canvas);
        color: var(--nh-theme-bg-detail);
        overflow: auto;
      }

      .navBarGroupCentric,
      .navBarAppletCentric {
        background-color: var(--nh-theme-bg-surface);
        min-height: 72px;
        height: 72px;
      }

      .left-sidebar,
      #nh-logo,
      #nh-logo-col {
        background-color: var(--nh-colors-eggplant-950);
      }

      @media (min-width: 640px) {
        main {
          max-width: none;
        }
      }

      .invisible {
        display: none;
      }

      .highlightedAppletCentric {
        border: var(--nh-theme-bg-surface) 1px solid;
        border-radius: calc(1px * var(--nh-radii-2xl)) !important;
      }

      .highlightedHome {
        border: transparent 1px solid;
      }

      .homeIconHover {
        border: transparent 1px solid;
      }

      .homeIconHover:hover {
        border: transparent 1px solid;
      }

      .groupCentricIconHover, .highlightedGroupCentric {
        border: transparent 2px solid;
        border-radius: 50%;
        transition: border-radius 0.2s ease-in;
      }
      .groupCentricIconHover:hover,.highlightedGroupCentric {
        border-radius: calc(12px);
        border-color: var(--nh-theme-bg-canvas);
      }

      .user-profile:hover,
      .group-add:hover,
      .applet-add:hover,
      .dashboard-icon:hover {
        box-shadow: 0px 0px 20px #6e46cc;
        border: 1px solid var(--nh-theme-bg-surface) !important;
      }
      .dashboard-icon:hover,
      .user-profile:hover,
      .group-add:hover,
      .applet-add:hover {
        border-radius: 50%;
      }

      .appletCentricIconHover {
        border: transparent 1px solid;
      }

      .appletCentricIconHover:hover {
        border: var(--nh-theme-accent-muted) 1px solid;
        box-shadow: 0px 0px 20px #6e46cc;
      }

      .navigation-switch {
        color: white;
        cursor: pointer;
        z-index: 2;
        background: url(./user-icon.png);
      }

      .group-home-button {
        --mdc-theme-secondary: #303f9f;
        --mdc-fab-focus-outline-color: white;
      }

      .applet-home-button {
        margin-bottom: 4px;
        --mdc-theme-secondary: #9ca5e3;
        --mdc-fab-focus-outline-color: white;
        --mdc-fab-focus-outline-width: 4px;
      }
    `,
  ];
}
