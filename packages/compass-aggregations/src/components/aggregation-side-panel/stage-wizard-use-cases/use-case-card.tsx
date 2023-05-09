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

const cardStyles = css({
  cursor: 'pointer',
  padding: spacing[3],
});

const cardTitleStyles = css({
  display: 'inline',
  marginRight: spacing[2],
});

type UseCaseCardProps = {
  onSelect: () => void;
} & Pick<StageWizardUseCase, 'id' | 'title' | 'stageOperator'>;

const UseCaseCard = ({
  id,
  title,
  stageOperator,
  onSelect,
}: UseCaseCardProps) => {
  return (
    <KeylineCard
      data-testid={`use-case-${id}`}
      onClick={onSelect}
      className={cardStyles}
    >
      <Body className={cardTitleStyles}>{title}</Body>
      <Link target="_blank" href={getStageHelpLink(stageOperator) as string}>
        {stageOperator}
      </Link>
    </KeylineCard>
  );
};

export default UseCaseCard;
