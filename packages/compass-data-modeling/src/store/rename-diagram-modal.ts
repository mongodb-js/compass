import type { Reducer } from 'redux';
import { isAction } from './util';
import { DiagramActionTypes } from './diagram';

export type RenameDiagramModalState = {
  isOpen: boolean;
  diagramId?: string;
  diagramName?: string;
};

export const RenameDiagramModalActionTypes = {
  OPEN_RENAME_DIAGRAM_MODAL:
    'data-modeling/rename-diagram/OPEN_RENAME_DIAGRAM_MODAL',
  CLOSE_RENAME_DIAGRAM_MODAL:
    'data-modeling/rename-diagram/CLOSE_RENAME_DIAGRAM_MODAL',
} as const;

type ModalOpenedAction = {
  type: typeof RenameDiagramModalActionTypes.OPEN_RENAME_DIAGRAM_MODAL;
  id: string;
  name: string;
};

type ModalClosedAction = {
  type: typeof RenameDiagramModalActionTypes.CLOSE_RENAME_DIAGRAM_MODAL;
};

export type OpenRenameDiagramModalAction = {
  type: typeof RenameDiagramModalActionTypes.OPEN_RENAME_DIAGRAM_MODAL;
  id: string;
  name: string;
};

export type CloseRenameDiagramModalAction = {
  type: typeof RenameDiagramModalActionTypes.CLOSE_RENAME_DIAGRAM_MODAL;
};

export type RenameDiagramModalActions = ModalOpenedAction | ModalClosedAction;

const INITIAL_STATE = {
  isOpen: false,
  diagramId: undefined,
};

export const renameDiagramModalReducer: Reducer<RenameDiagramModalState> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction(action, RenameDiagramModalActionTypes.OPEN_RENAME_DIAGRAM_MODAL)
  ) {
    return {
      ...state,
      isOpen: true,
      diagramId: action.id,
      diagramName: action.name,
    };
  }
  if (
    isAction(
      action,
      RenameDiagramModalActionTypes.CLOSE_RENAME_DIAGRAM_MODAL
    ) ||
    isAction(action, DiagramActionTypes.RENAME_DIAGRAM)
  ) {
    return INITIAL_STATE;
  }
  return state;
};

export function openRenameDiagramModal(
  id: string,
  name: string
): OpenRenameDiagramModalAction {
  return {
    type: RenameDiagramModalActionTypes.OPEN_RENAME_DIAGRAM_MODAL,
    id,
    name,
  };
}

export function closeRenameDiagramModal() {
  return { type: RenameDiagramModalActionTypes.CLOSE_RENAME_DIAGRAM_MODAL };
}
