import React from 'react';

type ContextMenuProps = React.PropsWithChildren<{
  position: {
    x: number;
    y: number;
  };
}>;

export function ContextMenu({ children, position }: ContextMenuProps) {
  console.log('ContextMenu', position);
  return (
    <div
      style={{
        position: 'absolute',
        pointerEvents: 'all',
        left: position.x,
        top: position.y,
      }}
    >
      {children}
    </div>
  );
}
