import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';
import type { PipelineBuilderThunkAction } from '.';
import { parseShellBSON } from './pipeline-builder/pipeline-parser/utils';

enum ActionTypes {
  SidePanelToggled = 'compass-aggregations/sidePanelToggled',
  UseCaseChanged = 'compass-aggregations/useCaseChanged',
  UseCaseCancelled = 'compass-aggregations/useCaseCancelled',
  UseCaseApplied = 'compass-aggregations/useCaseApplied',
}

type SidePanelToggledAction = {
  type: ActionTypes.SidePanelToggled;
};

type UseCaseChangedAction = {
  type: ActionTypes.UseCaseChanged;
  useCase: {
    id: string;
    stageOperator: string;
    value: string;
    syntaxError?: SyntaxError;
  };
};

type UseCaseCancelledAction = {
  type: ActionTypes.UseCaseCancelled;
};

type UseCaseAppliedAction = {
  type: ActionTypes.UseCaseApplied;
};

type State = {
  isPanelOpen: boolean;
  // todo: remove these when we have a proper state for the use case
  useCase?: {
    id: string;
    stageOperator: string;
    value: string;
    syntaxError?: SyntaxError;
  };
};

export const INITIAL_STATE: State = {
  isPanelOpen: false,
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (isAction<SidePanelToggledAction>(action, ActionTypes.SidePanelToggled)) {
    return {
      ...state,
      isPanelOpen: !state.isPanelOpen,
    };
  }

  if (isAction<UseCaseChangedAction>(action, ActionTypes.UseCaseChanged)) {
    return {
      ...state,
      useCase: action.useCase,
    };
  }

  if (
    isAction<UseCaseCancelledAction>(action, ActionTypes.UseCaseCancelled) ||
    isAction<UseCaseAppliedAction>(action, ActionTypes.UseCaseApplied)
  ) {
    return {
      ...state,
      useCase: undefined,
    };
  }

  return state;
}

export const toggleSidePanel = (): SidePanelToggledAction => ({
  type: ActionTypes.SidePanelToggled,
});

export const selectUseCase = (
  useCaseId: string,
  stageOperator: string
): UseCaseChangedAction => ({
  type: ActionTypes.UseCaseChanged,
  useCase: {
    id: useCaseId,
    stageOperator,
    value: '',
  },
});

export const cancelUseCase = (): UseCaseCancelledAction => ({
  type: ActionTypes.UseCaseCancelled,
});

export const applyUseCase = (): PipelineBuilderThunkAction<
  void,
  UseCaseAppliedAction | UseCaseChangedAction
> => {
  return (dispatch, getState) => {
    const { useCase } = getState().sidePanel;
    if (!useCase) {
      return;
    }
    const { id, stageOperator, value } = useCase;

    try {
      parseShellBSON(value);
      console.log('use case applied', id, stageOperator, value);
    } catch (e) {
      dispatch({
        type: ActionTypes.UseCaseChanged,
        useCase: {
          ...useCase,
          syntaxError: e as SyntaxError,
        },
      });
    }
  };
};

export const changeUseCaseValue = (
  value: string
): PipelineBuilderThunkAction<void, UseCaseChangedAction> => {
  return (dispatch, getState) => {
    const { useCase } = getState().sidePanel;
    if (!useCase) {
      return;
    }
    dispatch({
      type: ActionTypes.UseCaseChanged,
      useCase: {
        ...useCase,
        syntaxError: undefined,
        value,
      },
    });
  };
};
