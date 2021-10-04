import React from 'react';
import debugModule from 'debug';
import AppRegistry from 'hadron-app-registry';

const debug = debugModule('mongodb-compass:home:HomeComponent');

export default function getRoleOrNull(
  appRegistry: AppRegistry,
  name: string
):
  | {
      component: React.JSXElementConstructor<unknown>;
    }[]
  | null {
  const role = appRegistry.getRole(name);
  if (!role) debug(`home plugin loading role, but ${name} is NULL`);
  return role ? role : null;
}
