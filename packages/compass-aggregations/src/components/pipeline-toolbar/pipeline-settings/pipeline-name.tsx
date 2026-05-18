import React from 'react';
import { connect } from 'react-redux';
import {
  Chip,
  Icon,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';

/**
 * Identity chip rendered in the pipeline toolbar when the user is
 * editing a saved pipeline. Matches the LoadedFavoriteChip in
 * compass-query-bar: same `Chip` primitive, same `Favorite` glyph,
 * same yellow dirty-dot convention. Without parity across the
 * Documents and Aggregations tabs, users would have to learn two
 * different "you have unsaved changes" cues.
 *
 * Hidden when `name` is empty — an unsaved / never-saved pipeline
 * doesn't need a chip; the absence of one tells the user they're in
 * scratch-pad mode.
 */

const chipWrapperStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[100],
  alignSelf: 'center',
});

const dirtyDotStyles = css({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  marginLeft: spacing[100],
  backgroundColor: palette.yellow.base,
});

type PipelineNameProps = {
  name: string;
  isModified: boolean;
};

export const PipelineName: React.FunctionComponent<PipelineNameProps> = ({
  name,
  isModified,
}) => {
  if (name === '') return null;
  return (
    <span
      className={chipWrapperStyles}
      data-testid="pipeline-name"
      data-dirty={isModified ? 'true' : 'false'}
      title={`${name}${isModified ? ' (unsaved changes)' : ''}`}
    >
      <Chip
        variant="blue"
        glyph={<Icon glyph="Favorite" />}
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {name}
            {isModified && (
              <span
                aria-label="Unsaved changes"
                className={dirtyDotStyles}
                data-testid="pipeline-name-dirty-dot"
              />
            )}
          </span>
        }
      />
    </span>
  );
};

const mapState = ({ name, isModified }: RootState) => ({
  name,
  isModified,
});

export default connect(mapState)(PipelineName);
