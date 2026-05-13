import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Subtitle,
  Body,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
  Icon,
} from '@mongodb-js/compass-components';
import { useGlobalAppRegistry } from '@mongodb-js/compass-app-registry';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { usePreference } from 'compass-preferences-model/provider';

const sectionContainerStyles = css({
  margin: 0,
  marginTop: spacing[400],
  padding: spacing[600],
  maxWidth: '450px',
  borderRadius: spacing[200],
  border: `1px solid ${palette.gray.light2}`,
  backgroundColor: palette.gray.light3,
});

const sectionContainerDarkStyles = css({
  backgroundColor: palette.gray.dark3,
  borderColor: palette.gray.dark2,
});

const titleStyles = css({
  fontSize: '14px',
});

const descriptionStyles = css({
  marginTop: spacing[200],
});

const ctaContainerStyles = css({
  marginTop: spacing[300],
});

const ctaButtonStyles = css({
  fontWeight: 'bold',
});

const ctaButtonLightStyles = css({
  background: palette.white,
  '&:hover': { background: palette.white },
  '&:focus': { background: palette.white },
});

/**
 * Discoverability card on the Welcome tab that announces the MCP server
 * feature and deep-links into Settings → MCP Server so the user can hook
 * up Claude Desktop / Cursor / VS Code / Windsurf in a couple of clicks.
 *
 * Hidden once the MCP server is enabled — at that point the user has
 * already found their way to Settings.
 */
export function McpWelcomeSection(): React.ReactElement | null {
  const darkMode = useDarkMode();
  const track = useTelemetry();
  const globalAppRegistry = useGlobalAppRegistry();
  const enableMcpServer = usePreference('enableMcpServer');

  if (enableMcpServer) {
    return null;
  }

  const handleClick = () => {
    track('MCP Setup Clicked', { screen: 'welcome' });
    // Open Settings directly on the MCP Server tab. Same pattern the
    // welcome modal already uses to deep-link Privacy, and the sidebar
    // header uses for other tab targets.
    globalAppRegistry.emit('open-compass-settings', 'mcp');
  };

  return (
    <div
      className={cx(
        sectionContainerStyles,
        darkMode && sectionContainerDarkStyles
      )}
      data-testid="welcome-tab-mcp-section"
    >
      <Subtitle className={titleStyles}>
        Connect AI tools to MongoDB Compass
      </Subtitle>
      <Body className={descriptionStyles}>
        Let Claude Desktop, Cursor, VS Code, and Windsurf run read-only queries
        against your saved connections via a local MCP server.
      </Body>
      <div className={ctaContainerStyles}>
        <Button
          data-testid="welcome-tab-mcp-setup-button"
          className={cx(ctaButtonStyles, !darkMode && ctaButtonLightStyles)}
          variant={ButtonVariant.PrimaryOutline}
          size={ButtonSize.Small}
          leftGlyph={<Icon glyph="Sparkle" />}
          onClick={handleClick}
        >
          SET UP MCP SERVER
        </Button>
      </div>
    </div>
  );
}
