'use strict';
/**
 * The event constant.
 */

export const DocumentEvents = {
  Cancel: 'Document::Cancel',
  Expanded: 'Document::Expanded',
  Collapsed: 'Document::Collapsed',
  VisibleElementsChanged: 'Document::VisibleElementsChanged',
  EditingStarted: 'Document::EditingStarted',
  EditingFinished: 'Document::EditingFinished',
  MarkedForDeletion: 'Document::MarkedForDeletion',
  DeletionFinished: 'Document::DeletionFinished',
  UpdateStarted: 'Document::UpdateStarted',
  UpdateSuccess: 'Document::UpdateSuccess',
  UpdateBlocked: 'Document::UpdateBlocked',
  UpdateError: 'Document::UpdateError',
  RemoveStarted: 'Document::RemoveStarted',
  RemoveSuccess: 'Document::RemoveSuccess',
  RemoveError: 'Document::RemoveError',
} as const;

export type DocumentEventsType =
  typeof DocumentEvents[keyof typeof DocumentEvents];
