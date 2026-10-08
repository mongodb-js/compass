import React from 'react';
import {
  Button,
  IconButton,
  Icon,
  css,
  spacing,
  Link,
  useTranslation,
} from '@mongodb-js/compass-components';
import { PIPELINE_HELP_URI } from '../../constants';

const containerStyles = css({ textAlign: 'center' });

const linkContainerStyles = css({
  marginTop: spacing[200],
  marginBottom: spacing[800],
  position: 'relative',
});

export type AddStageProps = {
  variant: 'button' | 'icon';
  onAddStage: () => void;
};

export const AddStage = ({ onAddStage, variant }: AddStageProps) => {
  const t = useTranslation();
  return (
    <div className={containerStyles}>
      {variant === 'icon' ? (
        <IconButton
          aria-label={t('aggregations.addStage', 'Add stage')}
          title={t('aggregations.addStage', 'Add stage')}
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
            {t('aggregations.addStage', 'Add stage')}
          </Button>

          <div className={linkContainerStyles}>
            <Link href={PIPELINE_HELP_URI}>
              {t(
                'aggregations.addStageLearnMore',
                'Learn more about aggregation pipeline stages'
              )}
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default AddStage;
