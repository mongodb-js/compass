import React from 'react';
import { getQueryAsShellJSString } from '../utils/get-shell-js';
import { Code } from '@mongodb-js/compass-components';

export function QueryViewer({
  query,
  ns,
}: {
  query: {
    filter?: Record<string, unknown>;
    project?: Record<string, unknown>;
    limit?: number;
    skip?: number;
  };
  ns: string;
}) {
  return (
    <div>
      <Code copyable={false} language="js">
        {getQueryAsShellJSString(ns, query)}
      </Code>
    </div>
  );
}
