import React from 'react';
import {
  Button,
  IconButton,
  Icon,
  css,
  spacing,
  Link,
  palette,
} from '@mongodb-js/compass-components';

const iconContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[2],
  marginBottom: spacing[2],
});

const buttonContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const linkContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[2],
  marginBottom: spacing[2],
});

const iconButtonStyles = css({
  backgroundColor: palette.gray.light1,
  color: palette.white,
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
          className={iconButtonStyles}
          aria-label="Add stage"
          title="Add stage"
          data-testid="add-stage-icon-button"
          onClick={() => onAddStage()}
        >
          <Icon glyph="Plus"></Icon>
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
        <Link href="https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/">
          Learn more about aggregation pipeline stages
        </Link>
      </div>
    </div>
  );
};

export default AddStage;
