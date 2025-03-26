import React from 'react';
import { NestedBorder } from './nested-border';
import { PreviewBorder } from './preview-border';
import type { NodeData, NodeType } from '../utils/types';
import { EntityCardGlyph } from '../nodes/entity-card-glyph';
import { spacing } from '@mongodb-js/compass-components';
import { ENTITY_CARD_ROW_HEIGHT } from '../utils/utils';
import styled from 'styled-components';

interface EntityCardRowProps {
  type: NodeType;
  data: NodeData;
  isDeEmphasised: boolean;
}

const EntityCardRowsWrapper = styled.div`
  padding: ${spacing[200]}px;
`;

const EntityCardBodyFieldName = styled.div`
  flex-grow: 1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EntityCardBodyFields = styled.div<{ isDeEmphasised: boolean }>`
  display: flex;
  align-items: center;
  height: ${ENTITY_CARD_ROW_HEIGHT}px;
  color: ${({ isDeEmphasised, theme }) =>
    isDeEmphasised
      ? theme.shared.diagram.entityCard.deEmphasised.color
      : 'inherit'};
`;

const EntityCardBodyFieldType = styled.div<{
  isDeEmphasised: boolean;
  type: NodeType;
}>`
  color: ${(props) =>
    props.isDeEmphasised
      ? props.theme.shared.diagram.entityCard.deEmphasised.fieldType
      : props.theme.shared.diagram.entityCard.fieldType};
  flex: 0 0 80px;
  font-weight: normal;
  text-align: right;
  padding-right: ${spacing[2]}px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${(props) => props.type === 'COLLECTION' && 'text-transform: lowercase;'}
`;

const EntityCardBodyFieldIcon = styled.div<{ count: string }>`
  display: flex;
  flex: 0 0 ${spacing[4] + spacing[1]}px;
  justify-content: space-between;
  align-items: center;
  margin-left: ${spacing[1]}px;
`;

export const EntityCardRows = ({
  type,
  data,
  isDeEmphasised,
}: EntityCardRowProps) => {
  const { fields } = data;

  const hasSelectedEdge = fields.some((field) => field.type === 'Highlighted');

  return (
    <EntityCardRowsWrapper>
      {fields.map(
        ({ name, description, depth, type: fieldType, glyphs }, idx) => (
          <div key={idx}>
            <EntityCardBodyFields
              key={idx}
              isDeEmphasised={
                (hasSelectedEdge && fieldType !== 'Highlighted') ||
                (isDeEmphasised && fieldType !== 'Highlighted')
              }
            >
              <EntityCardBodyFieldIcon
                count={glyphs && glyphs.length > 1 ? 'double' : 'single'}
              >
                {glyphs?.map((glyph) => (
                  <EntityCardGlyph
                    key={glyph}
                    glyph={glyph}
                    type={type}
                    isDimmed={
                      (hasSelectedEdge && fieldType !== 'Highlighted') ||
                      (isDeEmphasised && fieldType !== 'Highlighted')
                    }
                    isSelected={hasSelectedEdge}
                  />
                ))}
              </EntityCardBodyFieldIcon>
              {depth && <NestedBorder depth={depth} />}
              <EntityCardBodyFieldName>{name}</EntityCardBodyFieldName>
              <EntityCardBodyFieldType
                type={type}
                isDeEmphasised={
                  (hasSelectedEdge && fieldType !== 'Highlighted') ||
                  (isDeEmphasised && fieldType !== 'Highlighted')
                }
              >
                {description}
              </EntityCardBodyFieldType>
            </EntityCardBodyFields>
          </div>
        )
      )}
      <PreviewBorder fields={fields} />
    </EntityCardRowsWrapper>
  );
};
