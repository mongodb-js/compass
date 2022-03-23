import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';

import type { RootState } from '../../../modules';
import { collationChanged } from '../../../modules/collation';
import { collationStringChanged } from '../../../modules/collation-string';
import { openLink } from '../../../modules/link';

import LegacyPipelineCollation from '../../pipeline/collation-toolbar';

const PipelineCollation: React.FunctionComponent<PipelineCollationProps> = ({
  collation,
  collationString,
  collationChanged,
  collationStringChanged,
  openLink,
}) => {
  const props = {
    collation,
    collationString,
    collationChanged,
    collationStringChanged,
    openLink,
  };
  return <LegacyPipelineCollation {...props} />;
};

const mapState = ({ collation, collationString }: RootState) => ({
  collation,
  collationString,
});
const mapDispatch = {
  collationChanged,
  collationStringChanged,
  openLink,
};
const connector = connect(mapState, mapDispatch);
type PipelineCollationProps = ConnectedProps<typeof connector>;
export default connector(PipelineCollation);
