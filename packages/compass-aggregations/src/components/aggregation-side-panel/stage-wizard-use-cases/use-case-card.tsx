import React, { useCallback } from 'react';
import {
  Body,
  css,
  spacing,
  Badge,
  KeylineCard,
  cx,
} from '@mongodb-js/compass-components';

import { type StageWizardUseCase } from '.';
import { useDraggable } from '@dnd-kit/core';

export type DraggedUseCase = Pick<
  StageWizardUseCase,
  'id' | 'title' | 'stageOperator'
>;

type UseCaseCardProps = DraggedUseCase & {
  onSelect: () => void;
};

const longestUseCaseChars = 8;

const gridContainerStyles = css({
  display: 'grid',
  gridTemplateColumns: `1fr ${longestUseCaseChars}ch`,
  gap: '20px',
  '> *': {
    display: 'flex',
    alignItems: 'center',
  },
});

const cardOperatorStyles = css({ justifyContent: 'right' });

const cardStyles = css({
  padding: `${spacing[2]}px ${spacing[3]}px`,
  textAlign: 'left',
  width: '100%',
});

const cardStylesDragging = css({
  opacity: 0.5,
});

const cardStylesDropping = css({
  cursor: 'grabbing',
});

const cardBodyStyles = css({
  display: 'inline',
  marginRight: spacing[2],
});

type UseCaseCardLayoutProps = DraggedUseCase & {
  onSelect?: () => void;
  isDragging?: boolean;
  isDropping?: boolean;
};

export const UseCaseCardLayout = React.forwardRef(function UseCaseCardLayout(
  {
    id,
    title,
    stageOperator,
    isDragging,
    isDropping,
    onSelect,
    ...props
  }: UseCaseCardLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.code === 'Enter') {
        onSelect?.();
      }
    },
    [onSelect]
  );

  return (
    <KeylineCard
      ref={ref}
      contentStyle="clickable"
      className={cx(
        cardStyles,
        isDragging && cardStylesDragging,
        isDropping && cardStylesDropping
      )}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div className={gridContainerStyles}>
        <Body data-testid={`use-case-${id}`} className={cardBodyStyles}>
          {title}
        </Body>

        <div className={cardOperatorStyles}>
          <Badge>{stageOperator}</Badge>
        </div>
      </div>
    </KeylineCard>
  );
});

const UseCaseCard = ({
  id,
  title,
  stageOperator,
  onSelect,
}: UseCaseCardProps) => {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id,
    data: {
      type: 'use-case',
      draggedUseCase: {
        id,
        title,
        stageOperator,
      },
    },
  });

  return (
    <UseCaseCardLayout
      id={id}
      title={title}
      stageOperator={stageOperator}
      isDragging={isDragging}
      onSelect={onSelect}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    />
  );
};

export default UseCaseCard;
