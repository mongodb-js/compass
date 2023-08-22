import React from 'react';
import {
  KeylineCard,
  Body,
  Link,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import { getStageHelpLink } from '../../../utils/stage';
import type { StageWizardUseCase } from '.';
import { useDraggable } from '@dnd-kit/core';

export type DraggedUseCase = Pick<
  StageWizardUseCase,
  'id' | 'title' | 'stageOperator'
>;

type UseCaseCardProps = DraggedUseCase & {
  onSelect: () => void;
};

type UseCaseCardLayoutProps = DraggedUseCase & {
  onClick?: () => void;
};

const cardStyles = css({
  cursor: 'pointer',
  padding: spacing[3],
});

const cardTitleStyles = css({
  display: 'inline',
  marginRight: spacing[2],
});

export const UseCaseCardLayout = React.forwardRef(function UseCaseCardLayout(
  { id, title, stageOperator, ...props }: UseCaseCardLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <KeylineCard ref={ref} className={cardStyles} {...props}>
      <Body data-testid={`use-case-${id}`} className={cardTitleStyles}>
        {title}
      </Body>
      <Link
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        href={getStageHelpLink(stageOperator) as string}
      >
        {stageOperator}
      </Link>
    </KeylineCard>
  );
});

const UseCaseCard = ({
  id,
  title,
  stageOperator,
  onSelect,
}: UseCaseCardProps) => {
  const { setNodeRef, attributes, listeners } = useDraggable({
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
      onClick={onSelect}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    />
  );
};

export default UseCaseCard;
