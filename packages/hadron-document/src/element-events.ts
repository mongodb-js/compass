/**
 * The event constant.
 */
export const ElementEvents = {
  Added: 'Element::Added',
  Edited: 'Element::Edited',
  Removed: 'Element::Removed',
  Reverted: 'Element::Reverted',
  Converted: 'Element::Converted',
  Invalid: 'Element::Invalid',
  Valid: 'Element::Valid',
  Expanded: 'Element::Expanded',
  Collapsed: 'Element::Collapsed',
  VisibleElementsChanged: 'Element::VisibleElementsChanged',
} as const;

export type ElementEventsType =
  typeof ElementEvents[keyof typeof ElementEvents];
