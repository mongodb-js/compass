import React from 'react';
import { ControlButton, Controls, useReactFlow, useViewport } from 'reactflow';
import { Disclaimer, Icon } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { fontFamilies, spacing } from '@mongodb-js/compass-components';
import styled from 'styled-components';

const zoomTransitionOption = { duration: 500 };

const StyledControls = styled(Controls)`
  box-shadow: unset;
  > .react-flow__controls-button {
    background-color: ${(props) =>
      props.theme.shared.diagram.controls.background};
    border: 1px solid ${palette.gray.base};
    color: ${(props) => props.theme.shared.diagram.controls.zoomText};
  }
  > .react-flow__controls-button:hover {
    background-color: ${(props) =>
      props.theme.shared.diagram.controls.backgroundHover};
  }
`;

const StyledControlButton = styled(ControlButton)`
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
`;

const StyledFitViewButton = styled(ControlButton)`
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
`;

const ControlDisplay = styled.div`
  position: absolute;
  bottom: -2px;
  left: 42px;
  display: flex;
  user-select: none;
`;

const DiagramZoom = styled(Disclaimer)`
  color: ${(props) => props.theme.shared.diagram.controls.zoomText};
  font-family: ${fontFamilies.code};
  margin-right: ${spacing[3]}px;
`;

const DiagramTitle = styled(Disclaimer)`
  color: ${(props) => props.theme.shared.diagram.controls.zoomText};
  font-family: ${fontFamilies.code};
`;

interface DiagramControlsProps {
  title?: string;
}

export const DiagramControls = ({ title }: DiagramControlsProps) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  return (
    <StyledControls
      position={'bottom-left'}
      showFitView={false}
      showInteractive={false}
      showZoom={false}
    >
      <StyledControlButton
        data-testid="diagram-control-zoom-in"
        onClick={() => zoomIn(zoomTransitionOption)}
      >
        <Icon glyph="Plus" />
      </StyledControlButton>
      <ControlButton
        data-testid="diagram-control-zoom-out"
        onClick={() => zoomOut(zoomTransitionOption)}
      >
        <Icon glyph="Minus" />
      </ControlButton>
      <StyledFitViewButton
        data-testid="diagram-control-fit-view"
        onClick={() => fitView(zoomTransitionOption)}
      >
        <Icon glyph="FullScreenEnter" />
      </StyledFitViewButton>
      <ControlDisplay>
        <DiagramZoom data-testid="diagram-zoom">{`${Math.round(
          zoom * 100
        )}%`}</DiagramZoom>
        {title && (
          <DiagramTitle data-testid="diagram-title">{title}</DiagramTitle>
        )}
      </ControlDisplay>
    </StyledControls>
  );
};
