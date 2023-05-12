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

const cardStyles = css({
  cursor: 'pointer',
  padding: spacing[3],
});

const cardTitleStyles = css({
  display: 'inline',
  marginRight: spacing[2],
});

type UseCaseCardLayoutProps = Pick<
  StageWizardUseCase,
  'id' | 'title' | 'stageOperator'
>;

export const UseCaseCardLayout = ({
  id,
  title,
  stageOperator,
}: UseCaseCardLayoutProps) => {
  return (
    <KeylineCard data-testid={`use-case-${id}`} className={cardStyles}>
      <Body className={cardTitleStyles}>{title}</Body>
      <Link target="_blank" href={getStageHelpLink(stageOperator) as string}>
        {stageOperator}
      </Link>
    </KeylineCard>
  );
};

type UseCaseCardProps = { onSelect: () => void } & UseCaseCardLayoutProps;

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
    },
  });
  return (
    <KeylineCard
      data-testid={`use-case-${id}`}
      className={cardStyles}
      onClick={onSelect}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <Body className={cardTitleStyles}>{title}</Body>
      <Link target="_blank" href={getStageHelpLink(stageOperator) as string}>
        {stageOperator}
      </Link>
    </KeylineCard>
  );
};

export default UseCaseCard;
