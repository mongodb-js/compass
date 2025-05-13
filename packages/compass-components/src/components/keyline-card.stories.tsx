import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { KeylineCard } from './keyline-card';

const meta: Meta<typeof KeylineCard> = {
  title: 'Components/KeylineCard',
  component: KeylineCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    contentStyle: {
      control: 'select',
      options: ['clickable', 'none'],
      description: 'Set the content style of the card',
    },
  },
};

export default meta;
type Story = StoryObj<typeof KeylineCard>;

export const Default: Story = {
  args: {
    children: 'Default card content',
  },
};

export const Clickable: Story = {
  args: {
    contentStyle: 'clickable',
    children: 'Clickable card content',
  },
};

export const WithLongContent: Story = {
  args: {
    children: (
      <div>
        <h3>Card Title</h3>
        <p>This is a paragraph of text in the card.</p>
        <p>Here&apos;s another paragraph with more content.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
          <li>List item 3</li>
        </ul>
      </div>
    ),
  },
};
