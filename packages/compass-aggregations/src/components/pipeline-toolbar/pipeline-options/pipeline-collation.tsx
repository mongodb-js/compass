import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';

import type { RootState } from '../../../modules';
import { collationStringChanged } from '../../../modules/collation-string';
import { openLink } from '../../../modules/link';
import { maxTimeMSChanged } from '../../../modules/max-time-ms';

import LegacyPipelineCollation from '../../pipeline/collation-toolbar';

const PipelineCollation: React.FunctionComponent<PipelineCollationProps> = ({
  collationString,
  collationStringChanged,
  maxTimeMS,
  maxTimeMSChanged,
  openLink,
}) => {
  const props = {
    collationString,
    collationStringChanged,
    maxTimeMS,
    maxTimeMSChanged,
    openLink,
  };
  return <LegacyPipelineCollation {...props} />;
};

const mapState = ({
  collationString,
  settings: { maxTimeMS: defaultMaxTimeMS, isDirty },
  maxTimeMS,
}: RootState) => ({
  collationString,
  maxTimeMS: isDirty ? defaultMaxTimeMS : maxTimeMS,
});
const mapDispatch = {
  collationStringChanged,
  maxTimeMSChanged,
  openLink,
};
const connector = connect(mapState, mapDispatch);
type PipelineCollationProps = ConnectedProps<typeof connector>;
export default connector(PipelineCollation);
