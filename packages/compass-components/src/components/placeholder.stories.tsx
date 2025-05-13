import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Placeholder } from './placeholder';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';

const meta = {
  title: 'Components/Placeholder',
  component: Placeholder,
  parameters: {
    controls: { expanded: true },
  },
  tags: ['autodocs'],
  argTypes: {
    minChar: {
      control: { type: 'number', min: 1, max: 50 },
      description: 'Minimum number of characters for random width generation',
    },
    maxChar: {
      control: { type: 'number', min: 1, max: 50 },
      description: 'Maximum number of characters for random width generation',
    },
    width: {
      control: 'text',
      description:
        'Explicit width of the placeholder (overrides minChar/maxChar)',
    },
    height: {
      control: 'text',
      description: 'Height of the placeholder',
    },
    gradientStart: {
      control: 'color',
      description: 'Start color of the gradient animation',
    },
    gradientEnd: {
      control: 'color',
      description: 'End color of the gradient animation',
    },
    darkMode: {
      control: 'boolean',
      description: 'Whether to use dark mode styles',
    },
  },
} satisfies Meta<typeof Placeholder>;

export default meta;
type Story = StoryObj<typeof Placeholder>;

const containerStyles = css({
  padding: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
});

const rowStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

/**
 * Basic placeholder examples with default settings.
 */
export const Basic: Story = {
  render: () => {
    return (
      <div className={containerStyles}>
        <h3>Default Placeholders</h3>
        <div className={rowStyles}>
          <Placeholder />
          <Placeholder />
          <Placeholder />
        </div>
      </div>
    );
  },
};

/**
 * Placeholders with different explicit sizes.
 */
export const DifferentSizes: Story = {
  render: () => {
    return (
      <div className={containerStyles}>
        <h3>Different Sizes</h3>
        <div className={rowStyles}>
          <Placeholder width="10ch" height={spacing[200]} />
          <Placeholder width="20ch" height={spacing[300]} />
          <Placeholder width="30ch" height={spacing[400]} />
          <Placeholder width="40ch" height={spacing[500]} />
        </div>
      </div>
    );
  },
};

/**
 * Placeholders with different min/max character ranges to generate random widths.
 */
export const CharacterRanges: Story = {
  render: () => {
    return (
      <div className={containerStyles}>
        <h3>Min/Max Character Ranges</h3>
        <div className={rowStyles}>
          <Placeholder minChar={3} maxChar={6} />
          <Placeholder minChar={10} maxChar={15} />
          <Placeholder minChar={20} maxChar={30} />
        </div>
      </div>
    );
  },
};

/**
 * Placeholders with custom gradient colors.
 */
export const CustomGradients: Story = {
  render: () => {
    return (
      <div className={containerStyles}>
        <h3>Custom Gradients</h3>
        <div className={rowStyles}>
          <Placeholder
            gradientStart={palette.blue.light2}
            gradientEnd={palette.blue.light1}
          />
          <Placeholder
            gradientStart={palette.green.light2}
            gradientEnd={palette.green.light1}
          />
          <Placeholder
            gradientStart={palette.purple.light2}
            gradientEnd={palette.purple.light1}
          />
        </div>
      </div>
    );
  },
};

/**
 * Placeholders in dark mode.
 */
export const DarkMode: Story = {
  render: () => {
    return (
      <div
        className={containerStyles}
        style={{ backgroundColor: palette.black, color: palette.white }}
      >
        <h3>Dark Mode</h3>
        <div className={rowStyles}>
          <Placeholder darkMode={true} />
          <Placeholder darkMode={true} width="30ch" />
          <Placeholder
            darkMode={true}
            gradientStart={palette.blue.dark2}
            gradientEnd={palette.blue.dark1}
          />
        </div>
      </div>
    );
  },
};

/**
 * Interactive placeholder example with configurable properties.
 */
export const Interactive: Story = {
  args: {
    minChar: 5,
    maxChar: 15,
    height: spacing[400],
    darkMode: false,
  },
  render: (args) => (
    <div className={containerStyles}>
      <h3>Interactive Placeholder</h3>
      <Placeholder {...args} />
    </div>
  ),
};
