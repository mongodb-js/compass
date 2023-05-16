import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { css, cx, palette, spacing } from '@mongodb-js/compass-components';

import AddStage from '../add-stage/add-stage';
import type { AddStageProps } from '../add-stage/add-stage';

const useCaseDropMarkerStyles = css({
  width: '100%',
  height: spacing[1] / 4,
  borderRadius: spacing[1],
  background: palette.green.dark1,
  position: 'absolute',
});

type UseCaseDropMarkerProps = {
  id: number;
  className?: string;
};

const UseCaseDropMarker = (props: UseCaseDropMarkerProps) => {
  const { setNodeRef, isOver, active } = useDroppable({ id: props.id });
  const draggedElementIsUseCase = active?.data.current?.type === 'use-case';
  const draggedUseCaseIsOverMarker = isOver && draggedElementIsUseCase;
  const markerInlineStyles: React.CSSProperties = {
    visibility: draggedUseCaseIsOverMarker ? 'visible' : 'hidden',
  };

  return (
    <div
      ref={setNodeRef}
      className={cx(useCaseDropMarkerStyles, props.className)}
      style={markerInlineStyles}
      data-testid={`use-case-drop-marker-${props.id}`}
    />
  );
};

const separatorWithIconBtnStyles = css({
  marginTop: spacing[1] / 2,
  marginBottom: spacing[1] / 2,
  position: 'relative',
});

const separatorWithBtnAndLinkStyles = css({
  marginTop: spacing[4],
  marginBottom: spacing[3],
  position: 'relative',
});

const addStageStylesWithVisibleMarker = css({ visibility: 'hidden' });

const markerOnIconBtnStyles = css({ position: 'absolute', top: '50%' });
const markerOnBtnStyles = css({ position: 'absolute', top: -(spacing[4] / 2) });

export type StageSeparatorProps = {
  index: number;
  renderUseCaseDropMarker: boolean;
} & Omit<AddStageProps, 'className'>;

const StageSeparator = ({
  index,
  renderUseCaseDropMarker,
  ...props
}: StageSeparatorProps) => {
  return (
    <div
      className={cx({
        [separatorWithIconBtnStyles]: props.variant === 'icon',
        [separatorWithBtnAndLinkStyles]: props.variant === 'button',
      })}
    >
      {renderUseCaseDropMarker && (
        <UseCaseDropMarker
          id={index}
          className={cx({
            [markerOnIconBtnStyles]: props.variant === 'icon',
            [markerOnBtnStyles]: props.variant === 'button',
          })}
        />
      )}
      <AddStage
        {...props}
        className={cx({
          [addStageStylesWithVisibleMarker]:
            renderUseCaseDropMarker && props.variant === 'icon',
        })}
      />
    </div>
  );
};

export default StageSeparator;
