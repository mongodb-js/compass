import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WorkspaceContainer } from './workspace-container';
import { Button } from './leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const meta = {
  title: 'Components/WorkspaceContainer',
  component: WorkspaceContainer,
  parameters: {
    controls: { expanded: true },
  },
  tags: ['autodocs'],
  argTypes: {
    toolbar: {
      description: 'The toolbar content to display at the top of the container',
    },
    toolbarRef: {
      description: 'Ref to the toolbar element',
    },
    scrollableContainerRef: {
      description: 'Ref to the scrollable container element',
    },
    initialTopInView: {
      control: 'boolean',
      description: 'Whether the top of the content is initially in view',
    },
  },
} satisfies Meta<typeof WorkspaceContainer>;

export default meta;
type Story = StoryObj<typeof WorkspaceContainer>;

const longContentContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  padding: spacing[300],
});

const toolbarStyles = css({
  display: 'flex',
  padding: spacing[200],
  gap: spacing[200],
  alignItems: 'center',
});

const ContentBlock = () => (
  <div
    style={{
      padding: spacing[300],
      border: '1px solid currentColor',
      borderRadius: spacing[100],
    }}
  >
    Content block
  </div>
);

const WorkspaceContainerTemplate = (
  args: React.ComponentProps<typeof WorkspaceContainer>
) => {
  return (
    <div style={{ height: '400px' }}>
      <WorkspaceContainer {...args}>
        <div className={longContentContainerStyles}>
          {Array.from({ length: 20 }).map((_, i) => (
            <ContentBlock key={i} />
          ))}
        </div>
      </WorkspaceContainer>
    </div>
  );
};

/**
 * Basic example of the WorkspaceContainer component with minimal configuration.
 */
export const Basic: Story = {
  args: {},
  render: WorkspaceContainerTemplate,
};

/**
 * WorkspaceContainer with a toolbar at the top containing action buttons.
 */
export const WithToolbar: Story = {
  args: {
    toolbar: (
      <div className={toolbarStyles}>
        <Button>Toolbar Button 1</Button>
        <Button variant="default">Toolbar Button 2</Button>
      </div>
    ),
  },
  render: WorkspaceContainerTemplate,
};
