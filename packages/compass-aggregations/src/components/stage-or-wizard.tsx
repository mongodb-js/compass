import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useCallback, useRef } from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../modules';
import Stage from './stage';

type WizardProps = {
  id: number;
};

const Wizard = ({ id }: WizardProps) => {
  console.log(id);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { setNodeRef, transform, transition, listeners, isDragging } =
    useSortable({
      id: id + 1,
    });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    width: '100%',
    height: '150px',
    border: '1px solid rgba(0,0,0,0.2)',
  };

  const setContainerRef = useCallback(
    (ref: HTMLDivElement) => {
      setNodeRef(ref);
      containerRef.current = ref;
    },
    [containerRef, setNodeRef]
  );

  return (
    <div {...listeners} style={style} ref={setContainerRef}>
      Wizard {id}
    </div>
  );
};

export default connect((state: RootState, ownProps: { index: number }) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
  return { type: stage.type, id: stage.id };
})((props: any) => {
  if (props.type === 'wizard') {
    return <Wizard {...props} />;
  } else {
    return <Stage {...props} />;
  }
});
