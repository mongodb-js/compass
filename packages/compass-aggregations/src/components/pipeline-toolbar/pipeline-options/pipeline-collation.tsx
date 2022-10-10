import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { css, cx, Label, spacing, TextInput, palette } from '@mongodb-js/compass-components';

import type { RootState } from '../../../modules';
import { collationStringChanged } from '../../../modules/collation-string';
import { maxTimeMSChanged } from '../../../modules/max-time-ms';
import { DEFAULT_MAX_TIME_MS } from '../../../constants';

const pipelineOptionsContainerStyles = css({
  paddingTop: spacing[1],
  display: 'flex',
  alignItems: 'center',
});

const labelStyles = css({
  // A bit of vertical padding so users can click the label easier.
  padding: `${spacing[2]}px 0`,
  marginRight: spacing[2],
});

const collationInputStyles = css({
  flexGrow: 1,
  marginRight: spacing[2],
});

const inputStyles = css({
  input: {
    borderColor: 'transparent',
  },
});

const inputWithErrorStyles = css({
  input: {
    borderColor: palette.red.base,
  },
});

const collationLabelId = 'aggregations-collation-toolbar-input-label';
const collationInputId = 'aggregations-collation-toolbar-input';

const maxTimeMSLabelId = 'aggregations-max-time-ms-toolbar-input-label';
const maxTimeMSInputId = 'aggregations-max-time-ms-toolbar-input';

const PipelineCollation: React.FunctionComponent<PipelineCollationProps> = ({
  collationValue,
  collationHasError,
  collationStringChanged,
  maxTimeMSValue,
  maxTimeMSChanged,
}) => {
  const onMaxTimeMSChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (maxTimeMSChanged) {
        maxTimeMSChanged(parseInt(evt.currentTarget.value, 10));
      }
    },
    [maxTimeMSChanged]
  );

  return (
    <div
      className={pipelineOptionsContainerStyles}
      data-testid="collation-toolbar"
    >
      <Label
        data-testid="collation-toolbar-input-label"
        htmlFor={collationInputId}
        id={collationLabelId}
        className={labelStyles}
      >
        Collation
      </Label>
      <TextInput
        aria-labelledby={collationLabelId}
        id={collationInputId}
        data-testid="collation-string"
        className={cx(
          collationInputStyles,
          inputStyles,
          collationHasError && inputWithErrorStyles
        )}
        type="text"
        sizeVariant="small"
        state={collationHasError ? 'error' : 'none'}
        value={`${collationValue}`}
        onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
          collationStringChanged(evt.target.value)
        }
        placeholder="{ locale: 'simple' }"
      />
      <Label
        data-testid="maxtimems-toolbar-input-label"
        htmlFor={maxTimeMSInputId}
        id={maxTimeMSLabelId}
        className={labelStyles}
      >
        Max Time MS
      </Label>
      <TextInput
        aria-labelledby={maxTimeMSLabelId}
        id={maxTimeMSInputId}
        data-testid="max-time-ms"
        className={inputStyles}
        placeholder={`${DEFAULT_MAX_TIME_MS}`}
        type="number"
        min="0"
        sizeVariant="small"
        value={`${maxTimeMSValue ?? ''}`}
        onChange={onMaxTimeMSChanged}
      />
    </div>
  );
};

const mapState = ({
  collationString,
  maxTimeMS,
}: RootState) => ({
  collationValue: collationString.text,
  collationHasError: !collationString.isValid,
  maxTimeMSValue: maxTimeMS,
});

const mapDispatch = {
  collationStringChanged,
  maxTimeMSChanged,
};
const connector = connect(mapState, mapDispatch);
type PipelineCollationProps = ConnectedProps<typeof connector>;
export default connector(PipelineCollation);
