import type { Reducer } from 'redux';
import { isAction } from './util';
import type { DataModelingThunkAction } from './reducer';
import { exportToJson, exportToPng } from '../services/export-diagram';
import { getCurrentDiagramFromState, selectCurrentModel } from './diagram';
import { openToast } from '@mongodb-js/compass-components';
import { isCancelError } from '@mongodb-js/compass-utils';
import type { DiagramInstance } from '@mongodb-js/diagramming';

export type ExportDiagramFormat = 'png' | 'json';

export type ExportDiagramState = {
  isModalOpen: boolean;
  isExporting: boolean;
  exportFormat?: ExportDiagramFormat;
};

export enum ExportDiagramActionTypes {
  MODAL_OPENED = 'data-modeling/export-diagram/MODAL_OPENED',
  MODAL_CLOSED = 'data-modeling/export-diagram/MODAL_CLOSED',
  FORMAT_SELECTED = 'data-modeling/export-diagram/FORMAT_SELECTED',
  EXPORT_STARTED = 'data-modeling/export-diagram/EXPORT_STARTED',
  EXPORT_COMPLETED = 'data-modeling/export-diagram/EXPORT_COMPLETED',
}

type ModalOpenedAction = {
  type: ExportDiagramActionTypes.MODAL_OPENED;
};

type ModalClosedAction = {
  type: ExportDiagramActionTypes.MODAL_CLOSED;
};

type FormatSelectedAction = {
  type: ExportDiagramActionTypes.FORMAT_SELECTED;
  format: ExportDiagramFormat;
};

type ExportStartedAction = {
  type: ExportDiagramActionTypes.EXPORT_STARTED;
};

type ExportCompletedAction = {
  type: ExportDiagramActionTypes.EXPORT_COMPLETED;
};

export type ExportDiagramActions =
  | ModalOpenedAction
  | ModalClosedAction
  | FormatSelectedAction
  | ExportStartedAction
  | ExportCompletedAction;

const INITIAL_STATE = {
  isModalOpen: false,
  isExporting: false,
};

let cancelExportAbortController: AbortController | null = null;

export const exportDiagramReducer: Reducer<ExportDiagramState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction(action, ExportDiagramActionTypes.MODAL_OPENED)) {
    return {
      ...state,
      isModalOpen: true,
    };
  }
  if (isAction(action, ExportDiagramActionTypes.MODAL_CLOSED)) {
    return {
      ...state,
      isModalOpen: false,
    };
  }
  if (isAction(action, ExportDiagramActionTypes.FORMAT_SELECTED)) {
    return {
      ...state,
      exportFormat: action.format,
    };
  }
  if (isAction(action, ExportDiagramActionTypes.EXPORT_STARTED)) {
    return {
      ...state,
      isExporting: true,
    };
  }
  if (isAction(action, ExportDiagramActionTypes.EXPORT_COMPLETED)) {
    return {
      ...state,
      isExporting: false,
      isModalOpen: false,
    };
  }

  return state;
};

export function exportDiagram(
  diagramInstance: DiagramInstance
): DataModelingThunkAction<
  Promise<void>,
  ExportStartedAction | ExportCompletedAction
> {
  return async (dispatch, getState) => {
    const {
      exportDiagram: { exportFormat, isExporting },
      diagram,
    } = getState();
    if (!diagram || isExporting || !exportFormat) {
      return;
    }

    try {
      dispatch({
        type: ExportDiagramActionTypes.EXPORT_STARTED,
      });

      cancelExportAbortController = new AbortController();

      const model = selectCurrentModel(getCurrentDiagramFromState(getState()));
      if (exportFormat === 'json') {
        exportToJson(diagram.name, model);
      } else if (exportFormat === 'png') {
        await exportToPng(
          diagram.name,
          diagramInstance,
          cancelExportAbortController.signal
        );
      }
    } catch (error) {
      if (!isCancelError(error)) {
        openToast('export-diagram-error', {
          variant: 'warning',
          title: 'Export failed',
          description: `An error occurred while exporting the diagram: ${
            (error as Error).message
          }`,
        });
      }
    } finally {
      cancelExportAbortController = null;
      dispatch({
        type: ExportDiagramActionTypes.EXPORT_COMPLETED,
      });
    }
  };
}

export function showExportModal(): ModalOpenedAction {
  return { type: ExportDiagramActionTypes.MODAL_OPENED };
}

export function closeExportModal(): DataModelingThunkAction<
  void,
  ModalClosedAction
> {
  return (dispatch) => {
    cancelExportAbortController?.abort();
    dispatch({ type: ExportDiagramActionTypes.MODAL_CLOSED });
  };
}

export function selectFormat(
  format: ExportDiagramFormat
): FormatSelectedAction {
  return {
    type: ExportDiagramActionTypes.FORMAT_SELECTED,
    format,
  };
}
