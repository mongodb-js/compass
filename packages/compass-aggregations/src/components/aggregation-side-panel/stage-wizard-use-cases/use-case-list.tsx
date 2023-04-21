import React from 'react';
import {
  Body,
  css,
  KeylineCard,
  Link,
  spacing,
} from '@mongodb-js/compass-components';
import { STAGE_WIZARD_USE_CASES } from '.';
import { getStageHelpLink } from '../../../utils/stage';

const cardStyles = css({
  cursor: 'pointer',
  padding: spacing[3],
});

const cardTitleStyles = css({
  display: 'inline',
  marginRight: spacing[2],
});

const UseCaseList = ({ onSelect }: { onSelect: (id: string) => void }) => {
  return (
    <>
      {STAGE_WIZARD_USE_CASES.map(({ title, stageOperator, id }, index) => {
        return (
          <KeylineCard
            data-testid={`use-case-${id}`}
            key={index}
            onClick={() => onSelect(id)}
            className={cardStyles}
          >
            <Body className={cardTitleStyles}>{title}</Body>
            <Link
              target="_blank"
              href={getStageHelpLink(stageOperator) as string}
            >
              {stageOperator}
            </Link>
          </KeylineCard>
        );
      })}
    </>
  );
};

export default UseCaseList;
