import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Button, Icon } from '../leafygreen';
import { Tooltip } from '../tooltip';
import type { Signal } from '../signal-popover';
import { SignalPopover } from '../signal-popover';

const actionsGroupContainer = css({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  width: '100%',
  top: spacing[2] + spacing[1],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  pointerEvents: 'none',
});

const actionsGroupItem = css({
  flex: 'none',
  pointerEvents: 'all',
});

const actionsGroupItemSeparator = css({
  flex: '1 0 auto',
  pointerEvents: 'none',
});

const actionsGroupIdle = css({
  '& > [data-action-item]': {
    display: 'none',
  },
});

const actionsGroupHovered = css({
  '& > [data-action-item]': {
    display: 'block',
  },
});

// Insight icon is always visible, even when action buttons are not
const actionsGroupSignalPopover = css({
  display: 'block !important',
});

function useElementParentHoverState<T extends HTMLElement>(
  ref: React.RefObject<T>
): boolean {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const node = ref.current?.parentElement;

    const onMouseEnter = () => {
      setIsHovered(true);
    };

    const onMouseLeave = () => {
      setIsHovered(false);
    };

    node?.addEventListener('mouseenter', onMouseEnter);
    node?.addEventListener('mouseleave', onMouseLeave);

    return () => {
      node?.removeEventListener('mouseenter', onMouseEnter);
      node?.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [ref]);

  return isHovered;
}

function ActionButton({
  tooltipText,
  tooltipEnabled,
  ...props
}: Partial<React.ComponentProps<typeof Button>> & {
  tooltipText: string;
  tooltipEnabled: boolean;
}) {
  return (
    <Tooltip
      // We pass `enabled` as the buttons set their styles `display: false`
      // the container isn't hovered, which causes the tooltips to reset
      // their position to 0,0 and glitch visually without enabled.
      enabled={tooltipEnabled}
      trigger={({ children, ...tooltipProps }) => {
        return (
          <div data-action-item {...tooltipProps}>
            <Button {...props} />
            {children}
          </div>
        );
      }}
      justify="middle"
      delay={200} // The copy and clone buttons look alike so we keep the delay short.
    >
      {tooltipText}
    </Tooltip>
  );
}

const DocumentActionsGroup: React.FunctionComponent<
  {
    onEdit?: () => void;
    onCopy?: () => void;
    onClone?: () => void;
    onRemove?: () => void;
    onlyShowOnHover?: boolean;
    insights?: Signal | Signal[];
  } & (
    | { onExpand?: never; expanded?: never }
    | { onExpand: () => void; expanded: boolean }
  )
> = ({
  onEdit,
  onCopy,
  onClone,
  onRemove,
  onExpand,
  expanded,
  onlyShowOnHover = true,
  insights,
}) => {
  const [signalOpened, setSignalOpened] = useState(false);
  const conatinerRef = useRef<HTMLDivElement | null>(null);
  const isHovered = useElementParentHoverState(conatinerRef);
  const [showCopyButtonTooltip, setShowCopyButtonTooltip] = useState(false);
  const isActive = isHovered || signalOpened;

  useEffect(() => {
    if (showCopyButtonTooltip === true) {
      const tid = setTimeout(() => {
        setShowCopyButtonTooltip(false);
      }, 1200);
      return () => {
        clearTimeout(tid);
      };
    }
  }, [showCopyButtonTooltip]);

  return (
    <div
      ref={conatinerRef}
      className={cx(
        actionsGroupContainer,
        onlyShowOnHover && (isActive ? actionsGroupHovered : actionsGroupIdle)
      )}
    >
      {onExpand && (
        <ActionButton
          size="xsmall"
          tooltipEnabled={isActive}
          rightGlyph={
            <Icon
              role="presentation"
              glyph={expanded ? 'CaretDown' : 'CaretRight'}
            ></Icon>
          }
          aria-label={expanded ? 'Collapse all' : 'Expand all'}
          aria-pressed={expanded}
          data-testid="expand-document-button"
          onClick={onExpand}
          className={actionsGroupItem}
          tooltipText={expanded ? 'Collapse all' : 'Expand all'}
        />
      )}
      <span className={actionsGroupItemSeparator}></span>
      {insights && (
        <div
          className={cx(actionsGroupItem, actionsGroupSignalPopover)}
          data-action-item
        >
          <SignalPopover
            signals={insights}
            onPopoverOpenChange={setSignalOpened}
          ></SignalPopover>
        </div>
      )}
      {onEdit && (
        <ActionButton
          tooltipEnabled={isActive}
          size="xsmall"
          rightGlyph={<Icon role="presentation" glyph="Edit"></Icon>}
          aria-label="Edit document"
          data-testid="edit-document-button"
          onClick={onEdit}
          className={actionsGroupItem}
          tooltipText="Edit document"
        />
      )}
      {onCopy && (
        <Tooltip
          open={showCopyButtonTooltip}
          trigger={({ children }) => (
            <div data-action-item>
              <ActionButton
                tooltipEnabled={isActive}
                size="xsmall"
                rightGlyph={<Icon role="presentation" glyph="Copy"></Icon>}
                aria-label="Copy document to clipboard"
                data-testid="copy-document-button"
                onClick={() => {
                  setShowCopyButtonTooltip(true);
                  onCopy();
                }}
                className={actionsGroupItem}
                tooltipText="Copy to clipboard"
              />
              {children}
            </div>
          )}
          justify="middle"
        >
          Copied!
        </Tooltip>
      )}
      {onClone && (
        <ActionButton
          size="xsmall"
          tooltipEnabled={isActive}
          rightGlyph={<Icon role="presentation" glyph="Clone"></Icon>}
          aria-label="Clone document"
          data-testid="clone-document-button"
          onClick={onClone}
          className={actionsGroupItem}
          tooltipText="Clone document"
        />
      )}
      {onRemove && (
        <ActionButton
          size="xsmall"
          tooltipEnabled={isActive}
          rightGlyph={<Icon role="presentation" glyph="Trash"></Icon>}
          aria-label="Remove document"
          data-testid="remove-document-button"
          onClick={onRemove}
          className={actionsGroupItem}
          tooltipText="Remove document"
        />
      )}
    </div>
  );
};

export default DocumentActionsGroup;
