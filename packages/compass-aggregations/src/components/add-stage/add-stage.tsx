import React from 'react';
import {
  Button,
  IconButton,
  Icon,
  css,
  spacing,
  Link,
} from '@mongodb-js/compass-components';
import { PIPELINE_HELP_URI } from '../../constants';
import { useDroppable } from '@dnd-kit/core';
import { addStage } from '../../modules/pipeline-builder/stage-editor';
import { connect } from 'react-redux';

const iconContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[1] / 2,
  marginBottom: spacing[1] / 2,
});

const buttonContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[4],
  marginBottom: spacing[3],
});

const linkContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[2],
  marginBottom: spacing[2],
});

type AddStageProps = {
  variant: 'button' | 'icon';
  onAddStage: (index?: number) => void;
  index?: number;
};

export const AddStage = ({ onAddStage, variant, index }: AddStageProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: index ?? 0,
    data: {
      type: 'placeholder',
    },
  });
  if (variant === 'icon') {
    return (
      <div
        style={{
          backgroundColor: isOver ? 'red' : 'transparent',
        }}
        className={iconContainerStyles}
        ref={setNodeRef}
      >
        <IconButton
          aria-label="Add stage"
          title="Add stage"
          data-testid="add-stage-icon-button"
          onClick={() => onAddStage(index)}
        >
          <Icon glyph="PlusWithCircle"></Icon>
        </IconButton>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: isOver ? 'red' : 'transparent',
      }}
      className={buttonContainerStyles}
      ref={setNodeRef}
    >
      <Button
        data-testid="add-stage"
        onClick={() => onAddStage(index)}
        variant="primary"
        leftGlyph={<Icon glyph="Plus"></Icon>}
      >
        Add Stage
      </Button>

      <div className={linkContainerStyles}>
        <Link href={PIPELINE_HELP_URI}>
          Learn more about aggregation pipeline stages
        </Link>
      </div>
    </div>
  );
};

export default connect(() => ({}), {
  onAddStage: addStage,
})(AddStage);
