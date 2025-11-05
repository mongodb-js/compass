import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import {
  css,
  cx,
  Label,
  spacing,
  TextInput,
  palette,
  Tooltip,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../../modules';
import { collationStringChanged } from '../../../modules/collation-string';
import { maxTimeMSChanged } from '../../../modules/max-time-ms';
import { DEFAULT_MAX_TIME_MS } from '../../../constants';
import { usePreference } from 'compass-preferences-model/provider';

const pipelineOptionsContainerStyles = css({
  paddingTop: spacing[100],
  display: 'flex',
  alignItems: 'center',
});

const labelStyles = css({
  // A bit of vertical padding so users can click the label easier.
  padding: `${spacing[200]}px 0`,
  marginRight: spacing[200],
});

const collationInputStyles = css({
  flexGrow: 1,
  marginRight: spacing[200],
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
  const maxTimeMSEnvLimit = usePreference('maxTimeMSEnvLimit');

  const onMaxTimeMSChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (maxTimeMSChanged) {
        const parsed = Number(evt.currentTarget.value);
        const newValue = Number.isNaN(parsed) ? 0 : parsed;

        // When environment limit is set (> 0), enforce it
        if (maxTimeMSEnvLimit && newValue > maxTimeMSEnvLimit) {
          maxTimeMSChanged(maxTimeMSEnvLimit);
        } else {
          maxTimeMSChanged(newValue);
        }
      }
    },
    [maxTimeMSChanged, maxTimeMSEnvLimit]
  );

  const maxTimeMSLimit = usePreference('maxTimeMS');

  // Determine the effective max limit when environment limit is set (> 0)
  const effectiveMaxLimit = useMemo(() => {
    if (maxTimeMSEnvLimit) {
      return maxTimeMSLimit
        ? Math.min(maxTimeMSLimit, maxTimeMSEnvLimit)
        : maxTimeMSEnvLimit;
    }
    return maxTimeMSLimit;
  }, [maxTimeMSEnvLimit, maxTimeMSLimit]);

  // Check if value exceeds the environment limit (when limit > 0)
  const exceedsLimit = Boolean(
    useMemo(() => {
      return (
        maxTimeMSEnvLimit &&
        maxTimeMSValue &&
        maxTimeMSValue >= maxTimeMSEnvLimit
      );
    }, [maxTimeMSEnvLimit, maxTimeMSValue])
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
      <Tooltip
        enabled={exceedsLimit}
        open={exceedsLimit}
        trigger={({
          children,
          ...triggerProps
        }: React.HTMLProps<HTMLDivElement>) => (
          <div {...triggerProps}>
            <TextInput
              aria-labelledby={maxTimeMSLabelId}
              id={maxTimeMSInputId}
              data-testid="max-time-ms"
              className={inputStyles}
              placeholder={`${Math.min(
                DEFAULT_MAX_TIME_MS,
                effectiveMaxLimit || Infinity
              )}`}
              type="number"
              min="0"
              max={effectiveMaxLimit}
              sizeVariant="small"
              value={`${maxTimeMSValue ?? ''}`}
              state={
                (maxTimeMSValue &&
                  effectiveMaxLimit &&
                  maxTimeMSValue > effectiveMaxLimit) ||
                exceedsLimit
                  ? 'error'
                  : 'none'
              }
              onChange={onMaxTimeMSChanged}
            />
            {children}
          </div>
        )}
      >
        Operations longer than 5 minutes are not supported in the web
        environment
      </Tooltip>
    </div>
  );
};

const mapState = ({ collationString, maxTimeMS }: RootState) => ({
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
