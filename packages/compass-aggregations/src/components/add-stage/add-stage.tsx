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
  onAddStage: () => void;
};

export const AddStage = ({ onAddStage, variant }: AddStageProps) => {
  if (variant === 'icon') {
    return (
      <div className={iconContainerStyles}>
        <IconButton
          aria-label="Add stage"
          title="Add stage"
          data-testid="add-stage-icon-button"
          onClick={() => onAddStage()}
        >
          <Icon glyph="PlusWithCircle"></Icon>
        </IconButton>
      </div>
    );
  }

  return (
    <div className={buttonContainerStyles}>
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
