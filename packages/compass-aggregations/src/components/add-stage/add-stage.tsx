import React from 'react';
import {
  Button,
  IconButton,
  Icon,
  css,
  spacing,
  Link,
  palette,
} from '@mongodb-js/compass-components';
import { PIPELINE_HELP_URI } from '../../constants';
import { useDroppable } from '@dnd-kit/core';

const useCaseDropMarkerStyles = css({
  width: '100%',
  height: spacing[1],
  borderRadius: spacing[1],
  background: palette.green.dark1,
  position: 'absolute',
});

type UseCaseDropMarkerProps = {
  id: number;
  style?: React.CSSProperties;
};

const UseCaseDropMarker = (props: UseCaseDropMarkerProps) => {
  const { setNodeRef, isOver, active } = useDroppable({ id: props.id });
  const draggedElementIsUseCase = active?.data.current?.type === 'use-case';
  const draggedUseCaseIsOverMarker = isOver && draggedElementIsUseCase;
  const markerInlineStyles: React.CSSProperties = {
    ...props.style,
    visibility: draggedUseCaseIsOverMarker ? 'visible' : 'hidden',
  };

  return (
    <div
      ref={setNodeRef}
      className={useCaseDropMarkerStyles}
      style={markerInlineStyles}
      data-testid={`use-case-drop-marker-${props.id}`}
    />
  );
};

const iconContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[1] / 2,
  marginBottom: spacing[1] / 2,
  position: 'relative',
});

const buttonContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[4],
  marginBottom: spacing[3],
  position: 'relative',
});

const linkContainerStyles = css({
  textAlign: 'center',
  marginTop: spacing[2],
  marginBottom: spacing[2],
  position: 'relative',
});

type AddStageProps = {
  index: number;
  renderUseCaseDropMarker: boolean;
  variant: 'button' | 'icon';
  onAddStage: () => void;
};

export const AddStage = ({
  index,
  renderUseCaseDropMarker,
  onAddStage,
  variant,
}: AddStageProps) => {
  if (variant === 'icon') {
    return (
      <div className={iconContainerStyles}>
        {renderUseCaseDropMarker && (
          <UseCaseDropMarker id={index} style={{ top: '50%' }} />
        )}
        <IconButton
          aria-label="Add stage"
          title="Add stage"
          data-testid="add-stage-icon-button"
          onClick={() => onAddStage()}
          style={{ visibility: renderUseCaseDropMarker ? 'hidden' : 'visible' }}
        >
          <Icon glyph="PlusWithCircle"></Icon>
        </IconButton>
      </div>
    );
  }

  return (
    <div className={buttonContainerStyles}>
      {renderUseCaseDropMarker && (
        <UseCaseDropMarker id={index} style={{ top: -(spacing[4] / 2) }} />
      )}
      <Button
        data-testid="add-stage"
        onClick={() => onAddStage()}
        variant="primary"
        leftGlyph={<Icon glyph="Plus"></Icon>}
      >
        Add Stage
      </Button>

      <div className={linkContainerStyles}>
        <Link href={PIPELINE_HELP_URI}>
          Learn more about aggregation pipeline stages
        </Link>
      </div>
    </div>
  );
};

export default AddStage;
