import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import type { PropsWithChildren } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-types
export const DiagramProvider = ({ children }: PropsWithChildren<{}>) => {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
};
