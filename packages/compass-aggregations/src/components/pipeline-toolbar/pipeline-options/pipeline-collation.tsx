import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';

import type { RootState } from '../../../modules';
import { collationChanged } from '../../../modules/collation';
import { collationStringChanged } from '../../../modules/collation-string';
import { openLink } from '../../../modules/link';
import { maxTimeMSChanged } from '../../../modules/max-time-ms';

import LegacyPipelineCollation from '../../pipeline/collation-toolbar';

const PipelineCollation: React.FunctionComponent<PipelineCollationProps> = ({
  collation,
  collationString,
  collationChanged,
  collationStringChanged,
  openLink,
  maxTimeMS,
  maxTimeMSChanged,
}) => {
  const props = {
    collation,
    collationString,
    collationChanged,
    maxTimeMS,
    collationStringChanged,
    openLink,
    maxTimeMSChanged,
  };
  return <LegacyPipelineCollation {...props} />;
};

const mapState = ({
  collation,
  collationString,
  settings: { maxTimeMS: defaultMaxTimeMS, isDirty },
  maxTimeMS,
}: RootState) => ({
  collation,
  collationString,
  maxTimeMS: isDirty ? defaultMaxTimeMS : maxTimeMS,
});
const mapDispatch = {
  collationChanged,
  collationStringChanged,
  openLink,
  maxTimeMSChanged,
};
const connector = connect(mapState, mapDispatch);
type PipelineCollationProps = ConnectedProps<typeof connector>;
export default connector(PipelineCollation);
