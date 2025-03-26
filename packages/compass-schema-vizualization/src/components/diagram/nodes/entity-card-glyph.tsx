import React from 'react';
import type { NodeFieldGlyph, NodeType } from '../utils/types';
import { Icon, palette } from '@mongodb-js/compass-components';
import { useTheme } from 'styled-components';

interface Props {
  type: NodeType;
  glyph: NodeFieldGlyph;
  isDimmed: boolean;
  isSelected: boolean;
}

export const EntityCardGlyph = ({
  type,
  glyph,
  isDimmed,
  isSelected,
}: Props) => {
  const theme = useTheme();
  const getColor = () => {
    if (isDimmed) {
      return theme.shared.diagram.entityCard.deEmphasised.icon;
    } else if (isSelected) {
      return palette.blue.base;
    } else if (glyph === 'Key') {
      return type === 'TABLE'
        ? theme.shared.diagram.entityCard.relationalAccent
        : theme.shared.diagram.entityCard.mongoDBAccent;
    } else {
      return theme.shared.diagram.entityCard.icon;
    }
  };
  const getSize = () => {
    if (glyph === 'Link') {
      return 10;
    }
    return 12;
  };
  return <Icon size={getSize()} color={getColor()} glyph={glyph} />;
};
