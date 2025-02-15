import NHSelect, { OptionConfig } from "./select";
import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components";
import { NHTooltip } from "..";
import { b64images } from "@neighbourhoods/design-system-styles";

customElements.define('nh-select', NHSelect)
!customElements.get('nh-tooltip') && customElements.define('nh-tooltip', NHTooltip)

export interface SelectProps {
  options: OptionConfig[];
  placeholder: string;
  errored: boolean;
  required: boolean;
  defaultValue: OptionConfig;
  size: "medium" | "large";
}

const meta: Meta<SelectProps> = {
  title: "NHComponent/Input/Select",
  component: "nh-select",
  argTypes: {
    placeholder: { control: "text" },
    size: { options: ["medium", "large"], control: { type: "radio" } },
  },
  parameters: { 
    backgrounds: { default: 'surface' },
  },
  render: (args) => html`<nh-select
    .options=${args.options}
    .placeholder=${args.placeholder}
    .defaultValue=${args.defaultValue}
    .size=${args.size}
  >${args.placeholder}</nh-select>`,
};

export default meta;

type Story = StoryObj<SelectProps>;

export const Default: Story = {
  args: {
    placeholder: "Select dimension:",
    size: "medium",
    options: [
      {
        label: "One",
        value: "1"
      },
      {
        label: "Two",
        value: "2"
      },
      {
        label: "Three",
        value: "3"
      },
      {
        label: "Four",
        value: "4"
      },
      {
        label: "Five",
        value: "5"
      },
    ]
  },
};
export const DefaultValue: Story = {
  args: {
    placeholder: "Select dimension:",
    size: "medium",
    options: [
      {
        label: "One",
        value: "1"
      },
      {
        label: "Two",
        value: "2"
      },
      {
        label: "Three",
        value: "3"
      },
      {
        label: "Four",
        value: "4"
      },
      {
        label: "Five",
        value: "5"
      },
    ],
    defaultValue: {
      label: "Two",
      value: "2"
    }
  },
};

export const DefaultImages: Story = {
  args: {
    placeholder: "Select dimension:",
    size: "large",
    options: [
      {
        label: "One",
        value: "1",
        imageB64: b64images.icons.chili
      },
      {
        label: "Two",
        value: "2",
        imageB64: b64images.icons.fire
      },
      {
        label: "Three",
        value: "3",
        imageB64: b64images.icons.icecube
      },
      {
        label: "Four",
        value: "4",
        imageB64: b64images.icons.pear
      },
      {
        label: "Five",
        value: "5",
        imageB64: b64images.icons.snowflake
      },
    ]
  },
};

export const ImagesTooltipWithDefault: Story = {
  render: (args) => html` <nh-tooltip .visible=${true} .variant=${"primary"} .text=${"Info about your field"}>
    <nh-select
    .required=${args.required}
    .errored=${args.errored}
    .size=${"large"}
    class="untouched"
    slot="hoverable"
    .options=${args.options}
    .placeholder=${args.placeholder}
    .defaultValue=${args.defaultValue}
    >${args.placeholder}</nh-select>
  </nh-tooltip>
  `,
  
  args: {
    defaultValue: 
    {
      label: "One",
      value: "1",
      imageB64: b64images.icons.chili
    },
    placeholder: "Select dimension:",
    size: "medium",
    options: [
      {
        label: "One",
        value: "1",
        imageB64: b64images.icons.chili
      },
      {
        label: "Two",
        value: "2",
        imageB64: b64images.icons.fire
      },
      {
        label: "Three",
        value: "3",
        imageB64: b64images.icons.icecube
      },
      {
        label: "Four",
        value: "4",
        imageB64: b64images.icons.pear
      },
      {
        label: "Five",
        value: "5",
        imageB64: b64images.icons.snowflake
      },
    ]
  },
};

export const WithTooltip: Story = {
  render: (args) => html` <nh-tooltip .visible=${true} .variant=${"primary"} .text=${"Info about your field"}>
    <nh-select
    slot="hoverable"
    .options=${args.options}
    .placeholder=${args.placeholder}
    .size=${args.size}
    >${args.placeholder}</nh-select>
  </nh-tooltip>
  `,
  args: {
    placeholder: "Please select something:",
    size: "medium",
    options: [
      {
        label: "One",
        value: "1"
      },
      {
        label: "Two",
        value: "2"
      },
      {
        label: "Three",
        value: "3"
      },
      {
        label: "Four",
        value: "4"
      },
      {
        label: "Five",
        value: "5"
      },
    ],
  },
};

export const ImagesTooltip: Story = {
  render: (args) => html` <nh-tooltip .visible=${true} .variant=${"primary"} .text=${"Info about your field"}>
    <nh-select
    .required=${args.required}
    .errored=${args.errored}
    .size=${"large"}
    class="untouched"
    slot="hoverable"
    .options=${args.options}
    .placeholder=${args.placeholder}
    >${args.placeholder}</nh-select>
  </nh-tooltip>
  `,
  
  args: {
    placeholder: "Select dimension:",
    size: "medium",
    options: [
      {
        label: "One",
        value: "1",
        imageB64: b64images.icons.chili
      },
      {
        label: "Two",
        value: "2",
        imageB64: b64images.icons.fire
      },
      {
        label: "Three",
        value: "3",
        imageB64: b64images.icons.icecube
      },
      {
        label: "Four",
        value: "4",
        imageB64: b64images.icons.pear
      },
      {
        label: "Five",
        value: "5",
        imageB64: b64images.icons.snowflake
      },
    ]
  },
};

export const RequiredErrored: Story = {
  render: (args) => html` <nh-tooltip .visible=${true} .variant=${"danger"} .text=${"This is a required field."}>
    <nh-select
    .required=${true}
    .errored=${true}
    slot="hoverable"
    .options=${args.options}
    .placeholder=${args.placeholder}
    .size=${args.size}
    >${args.placeholder}</nh-select>
  </nh-tooltip>
  `,
  args: {
    required: false,
    placeholder: "Please select something:",
    size: "medium",
    options: [
      {
        label: "One",
        value: "1"
      },
      {
        label: "Two",
        value: "2"
      },
      {
        label: "Three",
        value: "3"
      },
      {
        label: "Four",
        value: "4"
      },
      {
        label: "Five",
        value: "5"
      },
    ],
  },
};

export const ImagesRequiredErrored: Story = {
  ...RequiredErrored,
  args: {...RequiredErrored.args, errored: true, size: 'large', options: ImagesTooltip!.args!.options }
}