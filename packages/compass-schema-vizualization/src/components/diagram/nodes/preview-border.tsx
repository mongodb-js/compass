import React from 'react';
import { getPreviewStyle } from './preview-border-util';
import type { NodeField } from '../utils/types';
import { palette } from '@mongodb-js/compass-components';
import styled, { keyframes } from 'styled-components';

interface PreviewBorderProps {
  fields: Array<NodeField>;
}

export const rotateAnimation = keyframes`
    0% {
        background-position: left top, right bottom, left bottom, right top;
    }
    100% {
        background-position: left 15px top, right 15px bottom, left bottom 15px, right top 15px;
    }
`;

const StyledPreviewBorder = styled.div`
  background: linear-gradient(90deg, ${palette.blue.base} 50%, transparent 50%),
    linear-gradient(90deg, ${palette.blue.base} 50%, transparent 50%),
    linear-gradient(0deg, ${palette.blue.base} 50%, transparent 50%),
    linear-gradient(0deg, ${palette.blue.base} 50%, transparent 50%);
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-position: left top, right bottom, left bottom, right top;
  background-size: 15px 2px, 15px 2px, 2px 15px, 2px 15px;
  animation: ${rotateAnimation} 1s linear infinite;
  position: fixed;
  border-radius: 6px;
`;

export const PreviewBorder = ({ fields }: PreviewBorderProps) => {
  const numberPreviewFields = fields.filter(
    ({ type }) => type === 'Preview'
  ).length;

  if (numberPreviewFields === 0 || numberPreviewFields === fields.length) {
    return <></>;
  }

  const fieldStyle = getPreviewStyle(fields);

  if (!fieldStyle) {
    return <></>;
  }

  return (
    <StyledPreviewBorder
      data-testid="entity-card-preview-fields-border"
      style={fieldStyle}
    />
  );
};
