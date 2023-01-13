import React, { useEffect, useRef, useState } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Button, Icon } from '../leafygreen';
import { Tooltip } from '../tooltip';

const actionsGroupContainer = css({
  position: 'absolute',
  display: 'flex',
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

const DocumentActionsGroup: React.FunctionComponent<
  {
    onEdit?: () => void;
    onCopy?: () => void;
    onClone?: () => void;
    onRemove?: () => void;
    onlyShowOnHover?: boolean;
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
}) => {
  const conatinerRef = useRef<HTMLDivElement | null>(null);
  const isHovered = useElementParentHoverState(conatinerRef);
  const [showCopyButtonTooltip, setShowCopyButtonTooltip] = useState(false);

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
      className={actionsGroupContainer}
      style={{
        display: onlyShowOnHover ? (isHovered ? 'flex' : 'none') : 'flex',
      }}
    >
      {onExpand && (
        <Button
          size="xsmall"
          rightGlyph={
            <Icon
              role="presentation"
              glyph={expanded ? 'CaretDown' : 'CaretRight'}
            ></Icon>
          }
          title={expanded ? 'Collapse all' : 'Expand all'}
          aria-label={expanded ? 'Collapse all' : 'Expand all'}
          aria-pressed={expanded}
          data-testid="expand-document-button"
          onClick={onExpand}
          className={actionsGroupItem}
        ></Button>
      )}
      <span className={actionsGroupItemSeparator}></span>
      {onEdit && (
        <Button
          size="xsmall"
          rightGlyph={<Icon role="presentation" glyph="Edit"></Icon>}
          title="Edit document"
          aria-label="Edit document"
          data-testid="edit-document-button"
          onClick={onEdit}
          className={actionsGroupItem}
        ></Button>
      )}
      {onCopy && (
        <Tooltip
          open={showCopyButtonTooltip}
          trigger={({ children }) => {
            return (
              <div>
                <Button
                  size="xsmall"
                  rightGlyph={<Icon role="presentation" glyph="Copy"></Icon>}
                  title="Copy document"
                  aria-label="Copy document"
                  data-testid="copy-document-button"
                  onClick={() => {
                    setShowCopyButtonTooltip(true);
                    onCopy();
                  }}
                  className={actionsGroupItem}
                ></Button>
                {children}
              </div>
            );
          }}
          justify="middle"
        >
          Copied!
        </Tooltip>
      )}
      {onClone && (
        <Button
          size="xsmall"
          rightGlyph={<Icon role="presentation" glyph="Clone"></Icon>}
          title="Clone document"
          aria-label="Clone document"
          data-testid="clone-document-button"
          onClick={onClone}
          className={actionsGroupItem}
        ></Button>
      )}
      {onRemove && (
        <Button
          size="xsmall"
          rightGlyph={<Icon role="presentation" glyph="Trash"></Icon>}
          title="Remove document"
          aria-label="Remove document"
          data-testid="remove-document-button"
          onClick={onRemove}
          className={actionsGroupItem}
        ></Button>
      )}
    </div>
  );
};

export default DocumentActionsGroup;
