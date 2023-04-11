import React from 'react';
import {
  Badge,
  Body,
  css,
  KeylineCard,
  spacing,
} from '@mongodb-js/compass-components';
import { STAGE_WIZARD_USE_CASES } from '.';

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
            key={index}
            onClick={() => onSelect(id)}
            className={cardStyles}
          >
            <Body className={cardTitleStyles}>{title}</Body>
            <Badge>{stageOperator}</Badge>
          </KeylineCard>
        );
      })}
    </>
  );
};

export default UseCaseList;
