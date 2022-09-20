import React from 'react';

type ToolbarProps = {
  className?: string;
  children: React.ReactNode;
  'data-testid'?: string;
};

function Toolbar({
  children,
  'data-testid': dataTestId,
  className,
}: ToolbarProps) {
  return (
    <div className={className} data-testid={dataTestId}>
      {children}
    </div>
  );
}

export { Toolbar };
