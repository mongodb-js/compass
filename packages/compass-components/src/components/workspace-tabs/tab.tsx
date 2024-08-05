import React, { useMemo } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import type { glyphs } from '@leafygreen-ui/icon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';
import { useDarkMode } from '../../hooks/use-theme';
import { Icon, IconButton } from '../leafygreen';
import { mergeProps } from '../../utils/merge-props';
import { useDefaultAction } from '../../hooks/use-default-action';
import { LogoIcon } from '../icons/logo-icon';
import { Tooltip } from '../tooltip';
import { ServerIcon } from '../icons/server-icon';

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
  minWidth: spacing[1600] * 2, // 128px
  height: spacing[1000],
  position: 'relative',
  outline: 'none',

  backgroundColor: 'var(--workspace-tab-background-color)', // TODO
  color: 'var(--workspace-tab-color)',
  boxShadow: 'inset -1px -1px 0 0 var(--workspace-tab-border-color)',

  '&:hover': {
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

export type TabTheme = {
  '--workspace-tab-background-color': string;
  '--workspace-tab-selected-background-color': string;
  '--workspace-tab-top-border-color': string;
  '--workspace-tab-selected-top-border-color': string;
  '--workspace-tab-border-color': string;
  '--workspace-tab-color': string;
  '--workspace-tab-selected-color': string;
  '&:focus-visible': {
    '--workspace-tab-selected-color': string;
    '--workspace-tab-border-color': string;
  };
};

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

type IconGlyph = Extract<keyof typeof glyphs, string>;

type TabProps = {
  connectionName?: string;
  type: string;
  title: string;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onClose: () => void;
  iconGlyph: IconGlyph | 'Logo' | 'Server';
  tabContentId: string;
  tooltip?: [string, string][];
  tabTheme?: Partial<TabTheme>;
};

function Tab({
  connectionName,
  type,
  title,
  tooltip,
  isSelected,
  isDragging,
  onSelect,
  onClose,
  tabContentId,
  iconGlyph,
  tabTheme,
  ...props
}: TabProps & React.HTMLProps<HTMLDivElement>) {
  const darkMode = useDarkMode();
  const defaultActionProps = useDefaultAction(onSelect);
  const { listeners, setNodeRef, transform, transition } = useSortable({
    id: tabContentId,
  });

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

  const style = {
    transform: cssDndKit.Transform.toString(transform),
    transition,
    cursor: 'grabbing !important',
  };

  return (
    <Tooltip
      isDisabled={!tooltip}
      delay={300}
      trigger={({ children, ...props }) => {
        return (
          <div
            {...props}
            ref={setNodeRef}
            style={style}
            className={cx(
              tabStyles,
              themeClass,
              isSelected && selectedTabStyles,
              isSelected && tabTheme && selectedThemedTabStyles,
              isDragging && draggingTabStyles
            )}
            aria-selected={isSelected}
            role="tab"
            // Catch navigation on the active tab when a user tabs through Compass.
            tabIndex={isSelected ? 0 : -1}
            aria-controls={tabContentId}
            data-testid="workspace-tab-button"
            data-connectionName={connectionName}
            data-type={type}
            {...tabProps}
          >
            {children}
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
        );
      }}
    >
      {tooltip &&
        tooltip.map(([label, value]) => (
          <div key={label}>
            <b>{label}:</b> {value}
          </div>
        ))}
    </Tooltip>
  );
}

export { Tab };
