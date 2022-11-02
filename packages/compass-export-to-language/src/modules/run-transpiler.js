import toNS from 'mongodb-ns';
import compiler from 'bson-transpilers';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { transpiledExpressionChanged } from './transpiled-expression';
import { importsChanged } from './imports';
import { errorChanged } from './error';

export const runTranspiler = (input) => {
  return (dispatch, getState) => {
    const state = getState();
    const outputLang = state.outputLang;

    const useBuilders =
      state.builders && !(outputLang === 'java' && state.mode === 'Pipeline');

    try {
      let output;
      if (state.driver) {
        const ns = toNS(state.namespace);
        const toCompile = Object.assign(
          {
            options: {
              collection: ns.collection,
              database: ns.database,
              uri: state.uri,
            },
          },
          input
        );
        output = compiler.shell[outputLang].compileWithDriver(
          toCompile,
          useBuilders
        );
      } else {
        const toCompile = state.mode === 'Query' ? input.filter : input.aggregation;
        output = compiler.shell[outputLang].compile(
          toCompile,
          useBuilders,
          false
        );
      }

      dispatch(transpiledExpressionChanged(output));
      dispatch(
        importsChanged(compiler.shell[outputLang].getImports(state.driver))
      );
      dispatch(errorChanged(null));
      dispatch(
        globalAppRegistryEmit('compass:export-to-language:run', {
          language: outputLang,
          showImports: state.showImports,
          type: state.mode,
          driver: state.driver,
        })
      );
    } catch (e) {
      return dispatch(errorChanged(e.message));
    }
  };
};
