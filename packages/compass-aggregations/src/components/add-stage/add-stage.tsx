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

const containerStyles = css({ textAlign: 'center' });

const linkContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[2],
  marginBottom: spacing[3],
  position: 'relative',
});

export type AddStageProps = {
  variant: 'button' | 'icon';
  onAddStage: () => void;
};

export const AddStage = ({ onAddStage, variant }: AddStageProps) => {
  return (
    <div className={containerStyles}>
      {variant === 'icon' ? (
        <IconButton
          aria-label="Add stage"
          title="Add stage"
          data-testid="add-stage-icon-button"
          onClick={() => onAddStage()}
        >
          <Icon glyph="PlusWithCircle"></Icon>
        </IconButton>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default AddStage;
