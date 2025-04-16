import React from 'react';
import { connect } from 'react-redux';

type DataModelingPluginInitialProps = Record<string, never>;

const DataModeling: React.FunctionComponent<
  DataModelingPluginInitialProps
> = () => {
  return <>Hello from Data Modeling plugin</>;
};

export default connect()(DataModeling);
