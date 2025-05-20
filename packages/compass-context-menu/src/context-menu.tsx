import { createPortal } from 'react-dom';
import React from 'react';

type ContextMenuProps = React.PropsWithChildren<{
  position: {
    x: number;
    y: number;
  };
}>;

export function ContextMenu({ children, position }: ContextMenuProps) {
  const container = document.getElementById('context-menu-container');
  if (container === null) {
    throw new Error('Expected a container for the context menu in the DOM');
  }
  return createPortal(
    <div className="context-menu" style={{ left: position.x, top: position.y }}>
      {children}
    </div>,
    container
  );
}
