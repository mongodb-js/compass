import { Button } from '@mongodb-js/compass-components';
import React from 'react';

export const StageCreatorForm = ({
  name,
  children,
  onCancel,
  onApply,
}: {
  name: string;
  children: React.ReactNode;
  onCancel: () => void;
  onApply: () => void;
}) => {
  return (
    <form name={name}>
      {children}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '16px',
          gap: '8px',
        }}
      >
        <Button onClick={onCancel}>Cancel</Button>
        {/* The on apply click, should convert the form to stage */}
        <Button variant="primary" onClick={onApply}>
          Apply
        </Button>
      </div>
    </form>
  );
};
