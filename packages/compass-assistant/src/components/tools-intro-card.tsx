import React from 'react';
import {
  Card,
  Badge,
  Button,
  Link,
  Icon,
  css,
  spacing,
  cx,
  Description,
} from '@mongodb-js/compass-components';
import { useAssistantProjectId } from '../compass-assistant-provider';
import { buildProjectSettingsUrl } from '@mongodb-js/atlas-service/provider';

const shimmerBorderStyles = css({
  '@keyframes shimmer-border': {
    '0%': {
      backgroundPosition: '-200%',
    },

    '100%': {
      backgroundPosition: '200%',
    },
  },
  background: `linear-gradient(135deg, #00a35c 0% 25%, #016bf8 50%, #00a35c 75% 100%) 0 0 / 200% 100%`,
  animation: `3s ease-in-out infinite shimmer-border`,
  borderRadius: '8px',

  margin: `0 ${spacing[400]}px ${spacing[400]}px ${spacing[400]}px`,
  padding: '1px',
});

const cardStyles = css({
  position: 'relative',
  padding: spacing[300],
  borderRadius: '7px',
  borderColor: 'transparent',
});

const headerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing[200],
});

const titleContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  paddingRight: spacing[100],
});

const descriptionStyles = css({
  marginBottom: spacing[300],
  lineHeight: '20px',
});

const actionsStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[400],
});

const closeButtonStyles = css({
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'inherit',
  '&:hover': {
    opacity: 0.7,
  },
});

interface ToolsIntroCardProps {
  onDismiss: () => void;
}

export const ToolsIntroCard: React.FunctionComponent<ToolsIntroCardProps> = ({
  onDismiss,
}) => {
  const projectId = useAssistantProjectId();

  const settingsText = projectId
    ? 'project-wide in Project Settings'
    : 'in Settings';

  return (
    <div className={shimmerBorderStyles}>
      <Card className={cx(cardStyles)} data-testid="tools-intro-card">
        <div className={headerStyles}>
          <div className={titleContainerStyles}>
            <h4>Tools to talk to your data</h4>
            <Badge variant="blue">New</Badge>
          </div>
          <button
            className={closeButtonStyles}
            onClick={onDismiss}
            aria-label="Dismiss"
            data-testid="tools-intro-card-close"
          >
            <Icon glyph="X" size="small" />
          </button>
        </div>

        <Description className={descriptionStyles}>
          Explore your data effortlessly with natural language. These read-only
          tools never make changes and only run with your approval. Toggle them
          for this chat or manage them {settingsText}.
        </Description>

        <div className={actionsStyles}>
          {projectId && (
            <Button
              size="xsmall"
              onClick={() => {
                const url: string = buildProjectSettingsUrl({ projectId });
                window.open(url, '_blank');
              }}
              data-testid="tools-intro-card-view-settings"
            >
              View Settings
            </Button>
          )}
          <Link
            href="https://www.mongodb.com/docs/compass/query-with-natural-language/compass-ai-assistant/"
            data-testid="tools-intro-card-learn-more"
          >
            Learn more
          </Link>
        </div>
      </Card>
    </div>
  );
};
