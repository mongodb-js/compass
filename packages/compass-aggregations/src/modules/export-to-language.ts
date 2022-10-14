import {
  localAppRegistryEmit,
  globalAppRegistryEmit,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import { generateStageAsString } from './stage';
import type { PipelineBuilderThunkAction } from '.';


/**
 * Action creator for export to language events.
 */
export const exportToLanguage = (): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const { pipeline } = getState();
    // todo: align pipeline string generation
    const stagesStr = pipeline.filter(x => x.isEnabled)
      .map(s => generateStageAsString(s))
      .join(', ');
    const pipelineStr = `[${stagesStr}]`
    dispatch(
      localAppRegistryEmit(
        'open-aggregation-export-to-language',
        pipelineStr
      )
    );
    dispatch(
      globalAppRegistryEmit('compass:export-to-language:opened', {
        source: 'Aggregations',
      })
    );
  };
};
