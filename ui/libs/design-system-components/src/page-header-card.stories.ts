import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components";
import { b64images } from '@neighbourhoods/design-system-styles';

import { DashboardIconButtons, HorizontalTabButtons } from "./button-group.stories";
import NHButton from './button'
import NHButtonGroup from './button-group'
import NHPageHeaderCard from './page-header-card'

import { NHComponent } from './ancestors/base'

class TestRoot extends NHComponent implements PageHeaderCardProps{
  slotName: string;
  header: string;
  secondary: string;
  primary: string;
  primaryText: string;
  
  static elementDefinitions = {
    'nh-button': NHButton,
    'nh-button-group': NHButtonGroup,
    'nh-page-header-card': NHPageHeaderCard,
  }

  render() {
    return html`<nh-page-header-card
    slot=${this.slotName}
    .heading=${this.header}
  >
    ${this.secondary == "back"
      ? html`<img
          src="data:image/svg+xml;base64,${b64images.icons.backCaret}"
          slot="secondary-action"
        />`
      : this.secondary == "dashboard-menu"
      ? html`<nh-button-group
          .direction=${(HorizontalTabButtons.args as any).direction}
          .itemLabels=${(HorizontalTabButtons.args as any).itemLabels}
          .itemComponentTag=${(HorizontalTabButtons.args as any).itemComponentTag}
          .itemComponentProps=${(HorizontalTabButtons.args as any).itemComponentProps}
          .theme=${(HorizontalTabButtons.args as any).theme}
          .fixedFirstItem=${(HorizontalTabButtons.args as any).fixedFirstItem}
          .addItemButton=${(HorizontalTabButtons.args as any).addItemButton}
          slot="secondary-action"
        >
        </nh-button-group>`
      : null}
    ${this.primary == "dashboard-buttons"
      ? html`<nh-button-group
      .direction=${(DashboardIconButtons.args as any).direction}
      .itemLabels=${(DashboardIconButtons.args as any).itemLabels}
      .itemComponentTag=${(DashboardIconButtons.args as any).itemComponentTag}
      .itemComponentProps=${(DashboardIconButtons.args as any).itemComponentProps}
      .theme=${(DashboardIconButtons.args as any).theme}
      .fixedFirstItem=${(DashboardIconButtons.args as any).fixedFirstItem}
      .addItemButton=${(DashboardIconButtons.args as any).addItemButton}
      slot="primary-action"
    >
    </nh-button-group>`
      : this.primary == "button"
      ? html`<nh-button
          .variant=${"primary"}
          .size=${"auto"}
          slot="primary-action"
        >${this.primaryText}</nh-button>`
      : null}
  </nh-page-header-card>`
  }
}

customElements.define('page-header-card--test-root', TestRoot)

export interface PageHeaderCardProps {
  header: string;
  secondary: string;
  primary: string;
  primaryText: string;
  slotName: string;
}

const meta: Meta<PageHeaderCardProps> = {
  title: "NHComponent/PageHeaderCard",
  component: "page-header-card--test-root",
  argTypes: {},
  render: (args) => html`<page-header-card--test-root .header=${args.header} .secondary=${args.secondary} .primary=${args.primary} .primaryText=${args.primaryText}  .slotName=${args.slotName} />`,
};

export default meta;

type Story = StoryObj<PageHeaderCardProps>;

export const Basic: Story = {
  args: {
    slotName: "header",
    header: "Applet Library",
  },
};
export const AppletLibrary: Story = {
  args: {
    slotName: "header",
    header: "Applet Library",
    secondary: "back",
    primary: "button",
    primaryText: "Upload Applet File",
  },
};
export const Dashboard: Story = {
  args: {
    slotName: "top-menu",
    header: "",
    secondary: "dashboard-menu",
    primary: "dashboard-buttons",
    primaryText: "ok",
  },
};
