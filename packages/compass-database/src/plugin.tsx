import React from 'react';
import type { DatabaseProps } from './components/database';
import { Database } from './components/database';

export function DatabasePlugin(props: DatabaseProps) {
  return <Database {...props} />;
}

export function onActivated(_: unknown, { logger }: DatabaseProps) {
  return {
    store: {
      state: { logger },
    },
    deactivate() {
      /* nothing to do */
    },
  };
}
