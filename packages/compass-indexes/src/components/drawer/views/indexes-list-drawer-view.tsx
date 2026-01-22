import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';

type IndexesListPageProps = {
  namespace: string;
};

const IndexesListDrawerView: React.FunctionComponent<IndexesListPageProps> = ({
  namespace,
}) => {
  return <div>Indexes list for {namespace}</div>;
};

const mapState = ({ namespace }: RootState) => ({
  namespace,
});

const mapDispatch = {};

export default connect(mapState, mapDispatch)(IndexesListDrawerView);
