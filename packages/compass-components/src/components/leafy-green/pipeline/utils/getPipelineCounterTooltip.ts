/* eslint-disable filename-rules/match */
import type { ReactNode } from 'react';
import React from 'react';
import { onlyText } from 'react-children-utilities';
import flatMap from 'lodash/flatMap';

/**
 * A utility function which takes the React.children rendered by the Pipeline component
 * and returns the string which represents the full pipeline, for usage with the tooltip.
 *
 * @param children - the children rendered by the pipeline component
 * @returns string - the tooltip text
 */
export default function getPipelineCounterTooltip(children: ReactNode): string {
  const stages = (React.Children.map(children, onlyText) || []).filter(Boolean);

  return flatMap(stages, (value, index, array) =>
    array.length - 1 !== index ? [value, '>'] : value
  ).join(' ');
}
