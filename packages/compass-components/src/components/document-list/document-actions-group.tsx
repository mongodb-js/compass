import React, { useEffect, useRef, useState } from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Button, Icon } from '../leafygreen';

const actionsGroupContainer = css({
  position: 'absolute',
  display: 'flex',
  gap: spacing[2],
  width: '100%',
  top: spacing[3],
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
    showOnHover?: boolean;
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
  showOnHover = true,
}) => {
  const conatinerRef = useRef<HTMLDivElement | null>(null);
  const isHovered = useElementParentHoverState(conatinerRef);

  return (
    <div
      ref={conatinerRef}
      className={actionsGroupContainer}
      style={{ display: showOnHover ? (isHovered ? 'flex' : 'none') : 'flex' }}
    >
      {onExpand && (
        <Button
          size="xsmall"
          rightGlyph={
            <Icon glyph={expanded ? 'CaretDown' : 'CaretRight'}></Icon>
          }
          title={expanded ? 'Collapse all' : 'Expand all'}
          aria-pressed={expanded}
          data-test-id="expand-document-button"
          onClick={onExpand}
          className={actionsGroupItem}
        ></Button>
      )}
      <span className={actionsGroupItemSeparator}></span>
      {onEdit && (
        <Button
          size="xsmall"
          rightGlyph={<Icon glyph="Edit"></Icon>}
          title="Edit document"
          data-test-id="edit-document-button"
          onClick={onEdit}
          className={actionsGroupItem}
        ></Button>
      )}
      {onCopy && (
        <Button
          size="xsmall"
          rightGlyph={<Icon glyph="Copy"></Icon>}
          title="Copy document"
          data-test-id="copy-document-button"
          onClick={onCopy}
          className={actionsGroupItem}
        ></Button>
      )}
      {onClone && (
        <Button
          size="xsmall"
          rightGlyph={<Icon glyph="Clone"></Icon>}
          title="Clone document"
          data-test-id="clone-document-button"
          onClick={onClone}
          className={actionsGroupItem}
        ></Button>
      )}
      {onRemove && (
        <Button
          size="xsmall"
          rightGlyph={<Icon glyph="Trash"></Icon>}
          title="Remove document"
          data-test-id="remove-document-button"
          onClick={onRemove}
          className={actionsGroupItem}
        ></Button>
      )}
    </div>
  );
};

export default DocumentActionsGroup;
