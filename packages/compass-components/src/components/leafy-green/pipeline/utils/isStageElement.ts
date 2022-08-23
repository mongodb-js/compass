/* eslint-disable filename-rules/match */

import type { ReactNode, ReactElement } from 'react';
import type { StageProps } from '../Stage';
import type Stage from '../Stage';

/**
 * Helper function to check whether an element is a type of Stage element.
 * @param element the element to check
 * @returns boolean true if the element is a Stage element, false if not.
 */
export default function isStageElement(
  element: ReactNode
): element is ReactElement<StageProps, typeof Stage> {
  return (
    element !== null &&
    typeof element === 'object' &&
    'type' in element &&
    (element.type as any).displayName === 'Stage'
  );
}
