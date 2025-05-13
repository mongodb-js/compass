import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FadeInPlaceholder } from './content-with-fallback';
import { Button } from './leafygreen';

const meta = {
  title: 'Components/FadeInPlaceholder',
  component: FadeInPlaceholder,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isContentReady: {
      control: 'boolean',
      description: 'Whether the content is ready to be displayed',
    },
  },
} satisfies Meta<typeof FadeInPlaceholder>;

export default meta;
type Story = StoryObj<typeof FadeInPlaceholder>;

/**
 * The FadeInPlaceholder component is an enhanced version of ContentWithFallback
 * that provides fade-in animations and absolute positioning for the fallback content.
 *
 * Features:
 * - Fade-in animations for content transitions
 * - Absolute positioning for fallback content
 * - Configurable timeouts
 * - Smooth transitions between states
 */

const FadeInPlaceholderDemo = (
  args: React.ComponentProps<typeof FadeInPlaceholder>
) => {
  const [isReady, setIsReady] = useState(false);

  return (
    <div
      style={{
        width: '300px',
        height: '200px',
        border: '1px solid #ccc',
        padding: '20px',
      }}
    >
      <FadeInPlaceholder
        {...args}
        isContentReady={isReady}
        content={() => (
          <div>
            <h3>Content is Ready!</h3>
            <p>This content faded in after the fallback.</p>
          </div>
        )}
        fallback={() => (
          <div>
            <h3>Loading...</h3>
            <p>Please wait while content loads.</p>
          </div>
        )}
      />
      <div style={{ marginTop: '20px' }}>
        <Button onClick={() => setIsReady(!isReady)}>
          {isReady ? 'Reset' : 'Load Content'}
        </Button>
      </div>
    </div>
  );
};
FadeInPlaceholderDemo.displayName = 'FadeInPlaceholderDemo';

export const Default: Story = {
  args: {
    isContentReady: false,
  },
  render: FadeInPlaceholderDemo,
};

export const WithCustomClassName: Story = {
  args: {
    isContentReady: false,
    className: 'custom-fade-in-placeholder',
  },
  render: FadeInPlaceholderDemo,
};
