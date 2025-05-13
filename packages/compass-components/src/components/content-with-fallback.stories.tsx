import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ContentWithFallback } from './content-with-fallback';
import { Button } from './leafygreen';

const meta = {
  title: 'Components/ContentWithFallback',
  component: ContentWithFallback,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isContentReady: {
      control: 'boolean',
      description: 'Whether the content is ready to be displayed',
    },
    contentAfterFallbackTimeout: {
      control: 'number',
      description: 'Timeout before showing content after fallback (in ms)',
    },
    fallbackTimeout: {
      control: 'number',
      description: 'Timeout before showing fallback (in ms)',
    },
  },
} satisfies Meta<typeof ContentWithFallback>;

export default meta;
type Story = StoryObj<typeof ContentWithFallback>;

/**
 * The ContentWithFallback component provides a way to show a fallback UI while content is loading,
 * with smooth transitions between states.
 *
 * Features:
 * - Configurable timeouts for content and fallback display
 * - Smooth transitions between states
 * - Support for animated content appearance
 * - Flexible content and fallback rendering
 */

const ContentWithFallbackDemo = (
  args: React.ComponentProps<typeof ContentWithFallback>
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
      <ContentWithFallback
        {...args}
        isContentReady={isReady}
        content={(shouldRender, shouldAnimate) =>
          shouldRender && (
            <div style={{ animation: shouldAnimate ? 'fadeIn 0.3s' : 'none' }}>
              <h3>Content is Ready!</h3>
              <p>This content appeared after the fallback.</p>
            </div>
          )
        }
        fallback={(shouldRender) =>
          shouldRender && (
            <div>
              <h3>Loading...</h3>
              <p>Please wait while content loads.</p>
            </div>
          )
        }
      />
      <div style={{ marginTop: '20px' }}>
        <Button onClick={() => setIsReady(!isReady)}>
          {isReady ? 'Reset' : 'Load Content'}
        </Button>
      </div>
    </div>
  );
};
ContentWithFallbackDemo.displayName = 'ContentWithFallbackDemo';

export const Default: Story = {
  args: {
    isContentReady: false,
    contentAfterFallbackTimeout: 200,
    fallbackTimeout: 30,
  },
  render: ContentWithFallbackDemo,
};

export const WithCustomTimeouts: Story = {
  args: {
    isContentReady: false,
    contentAfterFallbackTimeout: 500,
    fallbackTimeout: 100,
  },
  render: ContentWithFallbackDemo,
};
