import React from 'react';
import {
  Body,
  Button,
  css,
  cx,
  Icon,
  KeylineCard,
  spacing,
} from '@mongodb-js/compass-components';

type SavePipelineCardProps = {
  id: string;
  name: string;
  onOpenPipeline: () => void;
  onDeletePipeline: () => void;
};

const containerStyles = css({
  margin: spacing[2],
});

const card = css({
  display: 'flex',
  alignItems: 'center',
  padding: spacing[2],
  '&:hover .controls': {
    visibility: 'visible',
  },
});

const controls = css({
  flex: 'none',
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  visibility: 'hidden',
});

const button = css({
  flex: 'none',
  // Because leafygreen buttons have transition: all by default and this causes
  // a lag when trying to hide the buttons, because the browser will transition
  // properties like display or visibility
  transitionProperty: 'background-color, box-shadow, border-color',
});

export const SavePipelineCard: React.FunctionComponent<
  SavePipelineCardProps
> = ({ id, name, onOpenPipeline, onDeletePipeline }) => {
  return (
    <div className={containerStyles}>
      <KeylineCard
        className={card}
        data-testid="saved-pipeline-card"
        data-pipeline-object-id={id}
        data-pipeline-object-name={name}
      >
        <Body as="div" data-testid="saved-pipeline-card-name">
          {name}
        </Body>
        <div className={cx(controls, 'controls')}>
          <Button
            className={button}
            size="xsmall"
            onClick={onOpenPipeline}
            data-testid="saved-pipeline-card-open-action"
          >
            Open
          </Button>
          <Button
            className={button}
            size="xsmall"
            onClick={onDeletePipeline}
            aria-label="Delete"
            data-testid="saved-pipeline-card-delete-action"
          >
            <Icon size="small" glyph="Trash"></Icon>
          </Button>
        </div>
      </KeylineCard>
    </div>
  );
};
