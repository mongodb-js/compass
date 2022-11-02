import React from 'react';
import getShellJS from '../utils/get-shell-js';
import { Code } from '@mongodb-js/compass-components';

export function QueryViewer({
  query,
  ns,
}: {
  query?: Record<string, unknown>;
  ns: string;
}) {
  return (
    <div>
      <Code copyable={false} language="js">
        {getShellJS(ns, query)}
      </Code>
    </div>
  );
}
