import React, { useMemo } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import type { GlyphName } from '@leafygreen-ui/icon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';
import { useId } from '@react-aria/utils';
import { useDarkMode } from '../../hooks/use-theme';
import { Icon, IconButton, useMergeRefs } from '../leafygreen';
import { mergeProps } from '../../utils/merge-props';
import { useDefaultAction } from '../../hooks/use-default-action';
import { LogoIcon } from '../icons/logo-icon';
import { Tooltip } from '../leafygreen';
import { ServerIcon } from '../icons/server-icon';
import { useTabTheme } from './use-tab-theme';
import { useContextMenuItems } from '../context-menu';

function focusedChild(className: string) {
  return `&:hover ${className}, &:focus-visible ${className}, &:focus-within:not(:focus) ${className}`;
}

const tabTransition = '.16s ease-in-out';

const tabStyles = css({
  display: 'grid',
  gridTemplateAreas: `
    "top top top"
    "icon text close"
  `,
  gridRowGap: 0,
  gridColumnGap: spacing[200],
  gridTemplateRows: `${spacing[100]}px 1fr`,
  gridTemplateColumns: 'min-content 1fr min-content',
  '&:hover, &:focus-visible, &:focus-within:not(:focus)': {
    gridTemplateColumns: 'min-content 1fr min-content',
  },
  alignItems: 'center',

  paddingBottom: spacing[100], // same as the top border

  maxWidth: spacing[800] * 6, // 192px
  minWidth: spacing[1600] + spacing[800], // 96px
  height: spacing[1000],
  position: 'relative',
  outline: 'none',

  backgroundColor: 'var(--workspace-tab-background-color)',
  color: 'var(--workspace-tab-color)',
  boxShadow: 'inset -1px -1px 0 0 var(--workspace-tab-border-color)',

  '&:hover': {
    backgroundColor: 'inherit',
    cursor: 'pointer',
    zIndex: 1,
  },

  '&:focus-visible': {
    boxShadow: 'inset 0 0 0 1px var(--workspace-tab-border-color)',
  },

  /*
    the text makes space for the button, 
    because the button takes no space
   */
  [focusedChild('.workspace-tab-title-container')]: {
    maxWidth: `calc(100% - ${spacing[600]}px - ${spacing[150]}px)`,
  },
  /*
    the button takes no space,
    so that the width does not jump as it shows/hides
   */
  [focusedChild('.workspace-tab-close-button')]: {
    display: 'inline-block',
    position: 'absolute',
    right: spacing[100],
    bottom: spacing[100] + spacing[50],
  },

  // instead of topBorder we use a pseudoelement, so that we can programmaticaly adjust the colors
  '&::before': {
    content: '""',
    backgroundColor: 'var(--workspace-tab-top-border-color)',
    height: spacing[100],
    width: '100%',
    display: 'block',
    gridArea: 'top',
  },
});

const tabLightThemeStyles = css({
  '--workspace-tab-background-color': palette.gray.light3,
  '--workspace-tab-selected-background-color': palette.white,
  '--workspace-tab-border-color': palette.gray.light2,
  '--workspace-tab-top-border-color': 'transparent',
  '--workspace-tab-color': palette.gray.base,
  '--workspace-tab-selected-color': palette.gray.dark3,
  '--workspace-tab-selected-border-color': 'transparent',
  '&:focus-visible': {
    '--workspace-tab-selected-color': palette.blue.base,
    '--workspace-tab-border-color': palette.blue.base,
  },
});

const tabDarkThemeStyles = css({
  '--workspace-tab-background-color': palette.gray.dark3,
  '--workspace-tab-selected-background-color': palette.black,
  '--workspace-tab-border-color': palette.gray.dark2,
  '--workspace-tab-top-border-color': 'transparent',
  '--workspace-tab-color': palette.gray.base,
  '--workspace-tab-selected-color': palette.white,
  '--workspace-tab-selected-border-color': 'transparent',
  '&:focus-visible': {
    '--workspace-tab-selected-color': palette.blue.light1,
    '--workspace-tab-`border-color`': palette.blue.light1,
  },
});

const selectedTabStyles = css({
  color: 'var(--workspace-tab-selected-color)',
  backgroundColor: 'var(--workspace-tab-selected-background-color)',
  boxShadow: 'inset -1px 0 0 0 var(--workspace-tab-border-color)',

  '&:hover': {
    backgroundColor: 'var(--workspace-tab-selected-background-color)',
    cursor: 'default',
  },

  '&::before': {
    backgroundColor: 'var(--workspace-tab-selected-top-border-color)',
    filter: 'brightness(0.85) saturate(2)',
  },
});

const selectedThemedTabStyles = css({});

const draggingTabStyles = css({
  cursor: 'grabbing !important',
});

const nonExistentStyles = css({
  color: palette.gray.base,
});

const tabIconStyles = css({
  color: 'currentColor',
  marginLeft: spacing[300],
});

const tabTitleContainerStyles = css({
  position: 'relative',
  minWidth: 0,
  marginRight: spacing[100],
});

const tabTitleStyles = css({
  fontSize: '12px',
  lineHeight: '16px',
  fontWeight: 'normal',
  color: 'currentColor',

  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',

  transform: 'translateY(0)',
  transition: tabTransition,
  transitionProperty: 'opacity, transform',
});

const closeButtonStyles = css({
  display: 'none',
  marginRight: spacing[100],
});

const workspaceTabTooltipStyles = css({
  overflowWrap: 'anywhere',
  textWrap: 'wrap',
});

// The plugins provide these essential props use to render the tab.
// The workspace-tabs component provides the other parts of TabProps.
export type WorkspaceTabPluginProps = {
  connectionName?: string;
  type: string;
  title: React.ReactNode;
  isNonExistent?: boolean;
  iconGlyph: GlyphName | 'Logo' | 'Server';
  tooltip?: [string, string][];
};

export type WorkspaceTabCoreProps = {
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onClose: () => void;
  onCloseAllOthers: () => void;
  tabContentId: string;
};

type TabProps = WorkspaceTabCoreProps & WorkspaceTabPluginProps;

function Tab({
  connectionName,
  type,
  title,
  tooltip,
  isNonExistent,
  isSelected,
  isDragging,
  onSelect,
  onDuplicate,
  onClose,
  onCloseAllOthers,
  tabContentId,
  iconGlyph,
  className: tabClassName,
  ...props
}: TabProps & Omit<React.HTMLProps<HTMLDivElement>, 'title'>) {
  const darkMode = useDarkMode();
  const defaultActionProps = useDefaultAction(onSelect);
  const { listeners, setNodeRef, transform, transition } = useSortable({
    id: tabContentId,
  });
  const tabTheme = useTabTheme();

  const tabProps = mergeProps<HTMLDivElement>(
    defaultActionProps,
    listeners ?? {},
    props
  );

  const themeClass = useMemo(() => {
    if (!tabTheme) {
      return darkMode ? tabDarkThemeStyles : tabLightThemeStyles;
    }

    return css(tabTheme);
  }, [tabTheme, darkMode]);

  const contextMenuRef = useContextMenuItems(
    () => [
      { label: 'Close all other tabs', onAction: onCloseAllOthers },
      { label: 'Duplicate', onAction: onDuplicate },
    ],
    [onCloseAllOthers, onDuplicate]
  );

  const mergedRef = useMergeRefs([setNodeRef, contextMenuRef]);

  const style = {
    transform: cssDndKit.Transform.toString(transform),
    transition,
    cursor: 'grabbing !important',
  };

  const tabId = useId();

  return (
    <Tooltip
      enabled={!!tooltip}
      // To make sure that tooltips are always on the bottom of the tab in
      // compass-web and are not hidden by the mms top navigation bar
      align="bottom"
      justify="start"
      trigger={
        <div
          ref={mergedRef}
          style={style}
          className={cx(
            tabStyles,
            themeClass,
            isNonExistent && nonExistentStyles,
            isSelected && selectedTabStyles,
            isSelected && tabTheme && selectedThemedTabStyles,
            isDragging && draggingTabStyles,
            tabClassName
          )}
          aria-selected={isSelected}
          role="tab"
          // Catch navigation on the active tab when a user tabs through Compass.
          tabIndex={isSelected ? 0 : -1}
          aria-controls={tabContentId}
          data-testid="workspace-tab-button"
          data-connection-name={connectionName}
          data-type={type}
          id={tabId}
          {...tabProps}
        >
          {iconGlyph === 'Logo' && (
            <LogoIcon
              height={16}
              color={
                isSelected
                  ? 'var(--workspace-tab-selected-color)'
                  : 'var(--workspace-tab-color)'
              }
              role="presentation"
              className={tabIconStyles}
              data-testid={`workspace-tab-icon-${iconGlyph}`}
            />
          )}
          {iconGlyph === 'Server' && (
            <ServerIcon
              color={
                isSelected
                  ? 'var(--workspace-tab-selected-color)'
                  : 'var(--workspace-tab-color)'
              }
              className={tabIconStyles}
              data-testid={`workspace-tab-icon-${iconGlyph}`}
            />
          )}
          {!['Logo', 'Server'].includes(iconGlyph) && (
            <Icon
              size="small"
              role="presentation"
              className={tabIconStyles}
              glyph={iconGlyph}
              data-testid={`workspace-tab-icon-${iconGlyph}`}
            />
          )}

          <div
            className={cx(
              tabTitleContainerStyles,
              'workspace-tab-title-container'
            )}
          >
            <div className={cx(tabTitleStyles, 'workspace-tab-title')}>
              {title}
            </div>
          </div>

          <IconButton
            className={cx(closeButtonStyles, 'workspace-tab-close-button')}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close Tab"
            data-testid="close-workspace-tab"
          >
            <Icon glyph="X" role="presentation" />
          </IconButton>
        </div>
      }
    >
      {tooltip && (
        <div data-testid="workspace-tab-tooltip">
          {tooltip.map(([label, value]) => (
            <div key={label} className={workspaceTabTooltipStyles}>
              <b>{label}:</b> {value}
            </div>
          ))}
        </div>
      )}
    </Tooltip>
  );
}

export { Tab };
