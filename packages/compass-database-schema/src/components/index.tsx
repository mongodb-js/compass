import React from 'react';
import { Provider } from 'react-redux';
import { getStore } from '../stores';
import DatabaseSchemaContainer from './database-schema-container';

const DatabaseSchemaPlugin = () => {
  return (
    <Provider store={getStore()}>
      <DatabaseSchemaContainer />
    </Provider>
  );
};

export default DatabaseSchemaPlugin;
