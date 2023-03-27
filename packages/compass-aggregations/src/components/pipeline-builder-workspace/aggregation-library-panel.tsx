import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';

const USE_CASES = [
  {
    id: '1',
    title: '$match Usecase',
  },
  {
    id: '2',
    title: '$group Usecase',
  },
  {
    id: '3',
    title: '$project Usecase',
  },
  {
    id: '4',
    title: '$sort Usecase',
  },
  {
    id: '5',
    title: '$unwind Usecase',
  },
];

interface UsecaseProps {
  usecase: {
    id: string;
    title: string;
  };
}

const Usecase = (props: UsecaseProps) => {
  const { usecase } = props;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `usecase-${usecase.id}`,
  });
  const usecaseStyles = css({
    width: '100%',
    padding: `${spacing[3]}px ${spacing[2]}px`,
    border: `1px solid rgba(0,0,0,0.3)`,
    borderRadius: '4px',
    cursor: 'pointer',
    transform: CSS.Translate.toString(transform),
    background: palette.white,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={usecaseStyles}
    >
      {usecase.title}
    </div>
  );
};

export const AggregationLibraryPanel = () => {
  // const { } = props;
  return (
    <>
      {USE_CASES.map((usecase) => (
        <Usecase key={usecase.id} usecase={usecase} />
      ))}
    </>
  );
};
