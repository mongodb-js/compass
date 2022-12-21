import React from 'react';
import {
  Body,
  Button,
  css,
  cx,
  Icon,
  KeylineCard,
  spacing
} from '@mongodb-js/compass-components';

type SavePipelineCardProps = {
  id: string;
  name: string;
  onOpenPipeline: () => void;
  onDeletePipeline: () => void;
};

const containerStyles = css({
  margin: spacing[2]
});

const card = css({
  display: 'flex',
  alignItems: 'center',
  padding: spacing[2],
  '&:hover .controls': {
    visibility: 'visible'
  }
});

const controls = css({
  flex: 'none',
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  visibility: 'hidden'
});

const button = css({
  flex: 'none'
});

export const SavePipelineCard: React.FunctionComponent<SavePipelineCardProps> = ({
  id,
  name,
  onOpenPipeline,
  onDeletePipeline
}) => {
  return (
    <div className={containerStyles}>
      <KeylineCard
        className={card}
        data-testid="saved-pipeline-card"
        data-pipeline-object-id={id}
      >
        <Body as="div" data-testid="saved-pipeline-card-name">
          {name}
        </Body>
        <div className={cx(controls, 'controls')}>
          <Button
            className={button}
            size="xsmall"
            onClick={onOpenPipeline}
          >
            Open
          </Button>
          <Button
            className={button}
            size="xsmall"
            onClick={onDeletePipeline}
            aria-label="Delete"
          >
            <Icon size="small" glyph="Trash"></Icon>
          </Button>
        </div>
      </KeylineCard>
    </div>
  );
};