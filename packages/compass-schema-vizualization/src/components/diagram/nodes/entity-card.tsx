import React from 'react';
import { Handle, Position, useStore, useViewport } from 'reactflow';

import { SimpleEntityCardContent } from './entity-card-content-simple';
import type { NodeType, NodeData } from '../utils/types';
import { getIsEntireCollectionPreview } from '../nodes/preview-border-util';
import { ellipsisTruncationStyle } from '../utils/ellipsis-truncation.css';
import {
  DEFAULT_NODE_PARAMETERS,
  ENTITY_CARD_HEADER_HEIGHT,
  ENTITY_CARD_WIDTH,
} from '../utils/utils';
import { EntityCardRows } from '../nodes/entity-card-row';
import styled, { css, useTheme } from 'styled-components';
import { Icon, fontFamilies, spacing } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { rotateAnimation } from '../nodes/preview-border';

interface EntityCardProps {
  type: NodeType;
  data: NodeData;
  selected?: boolean;
}

export const ZOOM_THRESHOLD = 0.5;

const EntityCardHeaderIcon = styled.div`
  display: flex;
  flex: 0 0 ${spacing[3]}px;
  margin-left: ${spacing[1]}px;
`;

const EntityCardBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 12px;
  line-height: 18px;
`;

const PreviewEntityCard = styled.div`
  background: linear-gradient(90deg, ${palette.blue.base} 50%, transparent 50%),
    linear-gradient(90deg, ${palette.blue.base} 50%, transparent 50%),
    linear-gradient(0deg, ${palette.blue.base} 50%, transparent 50%),
    linear-gradient(0deg, ${palette.blue.base} 50%, transparent 50%);
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-position: left top, right bottom, left bottom, right top;
  background-size: 15px 2px, 15px 2px, 2px 15px, 2px 15px;
  animation: ${rotateAnimation} 1s linear infinite;
  padding: ${spacing[1]}px;
  margin: -${spacing[1]}px;
  border-radius: ${spacing[2]}px;
`;

const EntityCardHandle = styled(Handle)<{
  isAddingSyntheticForeignKey: boolean;
  isOnTop: boolean;
}>`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  transform: none;
  ${(props) =>
    props.isAddingSyntheticForeignKey
      ? css`
          opacity: 0;
        `
      : css`
          visibility: hidden;
        `}
  ${(props) =>
    props.isOnTop &&
    css`
      z-index: 1;
    `}
`;

const EntityCardHeader = styled.div<{ isDeEmphasised: boolean }>`
  display: flex;
  align-items: center;
  font-size: 13px;
  line-height: 20px;
  font-weight: bold;
  height: ${ENTITY_CARD_HEADER_HEIGHT}px;
  padding: ${spacing[1]}px ${spacing[3]}px ${spacing[1]}px ${spacing[2]}px;
  ${(props) =>
    props.isDeEmphasised
      ? `
        background: ${props.theme.shared.diagram.entityCard.deEmphasised.backgroundHeader};
        color: ${props.theme.shared.diagram.entityCard.deEmphasised.colorHeader};
      `
      : `
        background: ${props.theme.shared.diagram.entityCard.backgroundHeader};
      `}
`;

const EntityCardBorder = styled.div<{ border?: string }>`
  ${(props) => {
    if (props.border) {
      return `
          outline: 2px solid ${props.border};
          outline-offset: ${spacing[1] - 1}px;
        `;
    }
  }}
`;

const EntityCardStyle = styled(EntityCardBorder)<{ background: string }>`
  position: relative;
  font-family: ${fontFamilies.code};
  background: ${(props) => props.theme.shared.diagram.entityCard.background};
  color: ${(props) => props.theme.shared.diagram.entityCard.color};
  width: ${ENTITY_CARD_WIDTH}px;
  border-radius: ${spacing[2]}px;
  overflow: hidden;

  &:hover {
    background: ${(props) =>
      props.theme.shared.diagram.entityCard.backgroundHover};
  }

  &::before {
    position: absolute;
    display: block;
    content: ' ';
    height: 100%;
    background: ${(props) => props.background};
    width: 2px;
  }
  border-left: 1px solid ${(props) => props.background};
  &:hover {
    border-left: 1px solid ${(props) => props.background};
  }

  border: 1px solid ${(props) => props.theme.shared.diagram.entityCard.border};
`;

export const EntityCard = ({ type, data, selected }: EntityCardProps) => {
  const { title, fields } = data;

  const { zoom } = useViewport();

  const isDimmed = type === 'DIMMED';

  const connectionNodeId = useStore((state) => state.connectionNodeId);

  const contextualZoom = zoom < ZOOM_THRESHOLD;

  const isEntireCollectionPreview = getIsEntireCollectionPreview(fields);

  const theme = useTheme();

  const getAccent = () => {
    if (type === 'TABLE') {
      return theme.shared.diagram.entityCard.relationalAccent;
    } else if (type === 'COLLECTION') {
      return theme.shared.diagram.entityCard.mongoDBAccent;
    }
    return theme.shared.diagram.entityCard.deEmphasised.relationalAccent;
  };

  const border = data.borderColor
    ? data.borderColor
    : selected
    ? palette.blue.base
    : undefined;

  const content = (
    <EntityCardStyle
      border={border}
      background={getAccent()}
      style={{ minHeight: `${data.height}px` }}
    >
      <EntityCardHandle
        isAddingSyntheticForeignKey={isDimmed}
        isOnTop={!connectionNodeId}
        id="source"
        position={Position.Right}
        type="source"
      />
      <EntityCardHandle
        isAddingSyntheticForeignKey={isDimmed}
        isOnTop={!connectionNodeId}
        id="target"
        position={Position.Left}
        type="target"
      />
      <EntityCardHeader isDeEmphasised={isDimmed}>
        {!contextualZoom && (
          <>
            <EntityCardHeaderIcon>
              <Icon
                data-testid="entity-card-drag-icon"
                fill={theme.shared.diagram.entityCard.icon}
                glyph="Drag"
              />
            </EntityCardHeaderIcon>
            <div className={ellipsisTruncationStyle}>{title}</div>
          </>
        )}
      </EntityCardHeader>
      <EntityCardBody
        style={{
          minHeight: `${
            (data.height || DEFAULT_NODE_PARAMETERS.height) -
            ENTITY_CARD_HEADER_HEIGHT
          }px`,
        }}
      >
        {contextualZoom ? (
          <SimpleEntityCardContent title={title} />
        ) : (
          <EntityCardRows type={type} data={data} isDeEmphasised={isDimmed} />
        )}
      </EntityCardBody>
    </EntityCardStyle>
  );

  if (isEntireCollectionPreview) {
    return (
      <PreviewEntityCard data-testid="entity-card-preview-new-document-border">
        {content}
      </PreviewEntityCard>
    );
  }

  return content;
};
