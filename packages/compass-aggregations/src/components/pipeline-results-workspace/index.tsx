import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';

import type { RootState } from '../../modules';

const PipelineResultsWorkspace: React.FunctionComponent<PipelineResultsWorkspace> =
  ({ loading, documents }) => {
    if (loading) {
      return <>Running aggregation</>;
    }
    return (
      <pre>
        <code>{JSON.stringify(documents, null, 2)}</code>
      </pre>
    );
  };

const mapState = ({ aggregation: { loading, documents } }: RootState) => ({
  loading,
  documents,
});
const mapDispatch = {};

const connector = connect(mapState, mapDispatch);
type PipelineResultsWorkspace = ConnectedProps<typeof connector>;
export default connector(PipelineResultsWorkspace);
