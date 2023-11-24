import React from 'react';
import { Database } from './components/database';

export function DatabasePlugin() {
  return <Database />;
}

export function onActivated() {
  return {
    store: {
      state: {},
    },
    deactivate() {
      /* nothing to do */
    },
  };
}
