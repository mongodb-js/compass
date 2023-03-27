import React from 'react';
import {
  Button,
  IconButton,
  Icon,
  css,
  spacing,
  Link,
} from '@mongodb-js/compass-components';
import { useDroppable } from '@dnd-kit/core';
import { PIPELINE_HELP_URI } from '../../constants';
import { palette } from '@leafygreen-ui/palette';

const linkContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[2],
  marginBottom: spacing[2],
});

type AddStageProps = {
  variant: 'button' | 'icon';
  index: number;
  onAddStage: () => void;
};

export const AddStage = ({ onAddStage, variant, index }: AddStageProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: `droppable-${index}` });

  if (variant === 'icon') {
    const iconContainerStyles = css({
      textAlign: 'center',
      marginTop: spacing[1] / 2,
      marginBottom: spacing[1] / 2,
      position: 'relative',
      '::after': {
        content: '" "',
        position: 'absolute',
        left: 0,
        right: 0,
        top: spacing[4] / 2,
        height: '2px',
        borderRadius: '4px',
        background: isOver ? palette.green.dark2 : 'transparent',
      },
    });

    return (
      <div ref={setNodeRef} className={iconContainerStyles}>
        {!isOver ? (
          <IconButton
            aria-label="Add stage"
            title="Add stage"
            data-testid="add-stage-icon-button"
            onClick={() => onAddStage()}
          >
            <Icon glyph="PlusWithCircle"></Icon>
          </IconButton>
        ) : (
          <div style={{ height: '28px' }}></div>
        )}
      </div>
    );
  }

  const buttonContainerStyles = css({
    textAlign: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[3],
    position: 'relative',
    '::after': {
      content: '" "',
      position: 'absolute',
      left: 0,
      right: 0,
      top: -spacing[2],
      height: '2px',
      borderRadius: '4px',
      background: isOver ? palette.green.dark2 : 'transparent',
    },
  });

  return (
    <div ref={setNodeRef} className={buttonContainerStyles}>
      <Button
        data-testid="add-stage"
        onClick={() => onAddStage()}
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

export default AddStage;
