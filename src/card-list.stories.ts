import "./card-list";
import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components";
import { Basic, CardProps } from "./card.stories";

interface CardListProps {
  cards: CardProps[];
  widgets: boolean;
  buttons: boolean;
  vertical: boolean;
  grid: boolean;
}
const meta: Meta<CardListProps> = {
  title: "NHComponentShoelace/CardList",
  component: "nh-card-list",
  argTypes: {
    cards: { control: "none" },
    widgets: { control: "boolean" },
    buttons: { control: "boolean" },
    vertical: { control: "boolean" },
    grid: { control: "boolean" },
  },
  render: (args) => {
    return html`<nh-card-list
      .type=${args.grid ? "grid" : "linear"}
      .direction=${args.vertical ? "vertical" : "horizontal"}
    >
      ${args.cards.map((card) => {
        card.hasWidget = args.widgets;
        card.hasPrimaryAction = args.buttons;
        return (Basic as any).render(card);
      })}</nh-card-list>`;
  },
};

export default meta;

type Story = StoryObj<CardListProps>;

export const Dark: Story = {
  args: {
    cards: [
      {
        title: "Card 1",
        heading: "Heading 1",
        hasContextMenu: true,
        theme: "dark",
        textSize: "md",
        footerAlign: "c"
      },
      {
        title: "Card 2",
        heading: "Heading 2",
        hasContextMenu: true,
        theme: "dark",
        textSize: "md",
        footerAlign: "c"
      },
      {
        title: "Card 3",
        heading: "Heading 3",
        hasContextMenu: true,
        theme: "dark",
        textSize: "md",
        footerAlign: "c"
      },
      // Add more cards as needed...
    ],
  },
};
export const Light: Story = {
  args: {
    cards: [
      {
        title: "Card 1",
        heading: "Heading 1",
        hasContextMenu: true,
        theme: "light",
        textSize: "md",
        footerAlign: "l"
      },
      {
        title: "Card 2",
        heading: "Heading 2",
        hasContextMenu: true,
        theme: "light",
        textSize: "md",
        footerAlign: "l"
      },
      {
        title: "Card 3",
        heading: "Heading 3",
        hasContextMenu: true,
        theme: "light",
        textSize: "md",
        footerAlign: "l"
      },
      // Add more cards as needed...
    ],
    widgets: true,
  },
};
