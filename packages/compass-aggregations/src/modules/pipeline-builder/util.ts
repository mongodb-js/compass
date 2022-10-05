import type { Action, AnyAction } from 'redux';
import type { ThunkAction as _ThunkAction } from 'redux-thunk';
import type { RootState } from '..';
import type { PipelineBuilder } from './pipeline-builder';

export type PipelineBuilderThunkAction<
  R,
  A extends Action<any> = AnyAction
> = _ThunkAction<R, RootState, { pipelineBuilder: PipelineBuilder }, A>;

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}
