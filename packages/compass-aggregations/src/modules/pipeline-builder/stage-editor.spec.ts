import { expect } from 'chai';
import type { Document } from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import { applyMiddleware, createStore as createReduxStore } from 'redux';
import thunk from 'redux-thunk';
import { PipelineBuilder } from './pipeline-builder';
import {
  changeStageOperator,
  changeStageValue,
  changeStageCollapsed,
  changeStageDisabled,
  addStage,
  addSearchStageBefore,
  moveStage,
  removeStage,
  loadStagePreview,
  mapBuilderStageToStoreStage,
  mapStoreStagesToStageIdAndType,
  runStage,
  addWizard,
  updateWizardValue,
  convertWizardToStage,
  StageEditorActionTypes,
} from './stage-editor';
import type { StageEditorState, StoreStage, Wizard } from './stage-editor';
import HadronDocument from 'hadron-document';
import reducer from '../';
import { createElectronPipelineStorage } from '@mongodb-js/my-queries-storage/electron';
import Sinon from 'sinon';
import type Stage from './stage';
import { mockDataService } from '../../../test/mocks/data-service';
import { getId } from './stage-ids';
import type { PreferencesAccess } from 'compass-preferences-model';
import { defaultPreferencesInstance } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import AppRegistry from '@mongodb-js/compass-app-registry';
import { ConnectionScopedAppRegistryImpl } from '@mongodb-js/compass-connections/provider';
import { createDefaultConnectionInfo } from '@mongodb-js/testing-library-compass';

const TEST_CONNECTION_INFO = createDefaultConnectionInfo();

const MATCH_STAGE: StoreStage = mapBuilderStageToStoreStage(
  {
    id: 1,
    operator: '$match',
    value: '{\n  _id: 1,\n}',
    syntaxError: null,
    disabled: false,
    isEmpty: false,
  } as Stage,
  0
);

const LIMIT_STAGE: StoreStage = mapBuilderStageToStoreStage(
  {
    id: 2,
    operator: '$limit',
    value: '10',
    syntaxError: null,
    disabled: false,
    isEmpty: false,
  } as Stage,
  1
);

const OUT_STAGE: StoreStage = mapBuilderStageToStoreStage(
  {
    id: 3,
    operator: '$out',
    value: '"match-and-limit"',
    syntaxError: null,
    disabled: false,
    isEmpty: false,
  } as Stage,
  2
);

const RERANK_STAGE: StoreStage = mapBuilderStageToStoreStage(
  {
    id: 4,
    operator: '$rerank',
    value: '{}',
    syntaxError: null,
    disabled: false,
    isEmpty: false,
  } as Stage,
  0
);

const SEARCH_STAGE: StoreStage = mapBuilderStageToStoreStage(
  {
    id: 5,
    operator: '$search',
    value: '{ text: { query: "foo", path: "title" } }',
    syntaxError: null,
    disabled: false,
    isEmpty: false,
  } as Stage,
  0
);

const createWizard = (): Wizard => ({
  id: getId(),
  type: 'wizard',
  useCaseId: '$sort',
  stageOperator: '$sort',
  value: null,
  syntaxError: null,
});

const PIPELINE = [MATCH_STAGE, LIMIT_STAGE, OUT_STAGE];
const PIPELINE_WITH_WIZARDS = [
  MATCH_STAGE,
  LIMIT_STAGE,
  createWizard(),
  createWizard(),
  OUT_STAGE,
  createWizard(),
];

function createPreferencesWithAutoEmbedPreview(
  enableAutoEmbeddingPublicPreview: boolean
): PreferencesAccess {
  const base = defaultPreferencesInstance;
  return {
    ...base,
    getPreferences() {
      return {
        ...base.getPreferences(),
        enableAutoEmbeddingPublicPreview,
      };
    },
  } as PreferencesAccess;
}

function createPreferencesWithSearchActivationProgramP2(
  enableSearchActivationProgramP2: boolean
): PreferencesAccess {
  const base = defaultPreferencesInstance;
  return {
    ...base,
    getPreferences() {
      return {
        ...base.getPreferences(),
        enableSearchActivationProgramP2,
      };
    },
  } as PreferencesAccess;
}

function createStore({
  pipelineSource = `[{$match: {_id: 1}}, {$limit: 10}, {$out: 'match-and-limit'}]`,
  stages = PIPELINE,
  preferences = defaultPreferencesInstance,
  dataService = mockDataService(),
}: {
  pipelineSource?: string;
  stages?: StageEditorState['stages'];
  preferences?: PreferencesAccess;
  dataService?: DataService;
}) {
  const pipelineBuilder = Sinon.spy(
    new PipelineBuilder(dataService, preferences, pipelineSource)
  ) as unknown as PipelineBuilder;

  const globalAppRegistry = new AppRegistry();
  const connectionInfoRef = {
    current: { ...TEST_CONNECTION_INFO, title: '' },
  };
  const connectionScopedAppRegistry = new ConnectionScopedAppRegistryImpl(
    globalAppRegistry.emit.bind(globalAppRegistry),
    connectionInfoRef
  );

  const store = createReduxStore(
    reducer,
    {
      dataService: {
        dataService,
      },
      pipelineBuilder: {
        stageEditor: {
          stages,
          stagesIdAndType: mapStoreStagesToStageIdAndType(stages),
        },
      },
    },
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry: new AppRegistry(),
        localAppRegistry: new AppRegistry(),
        atlasAiService: {} as any,
        pipelineBuilder,
        pipelineStorage: createElectronPipelineStorage({
          basepath: '/tmp/test',
        }),
        instance: {} as any,
        workspaces: {} as any,
        preferences,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        dataService: {} as any,
        connectionInfoRef,
        connectionScopedAppRegistry,
        collection: {
          fetchMetadata() {
            return Promise.resolve({ isFLE: false });
          },
        } as any,
        pollingIntervalRef: {
          searchIndexes: null,
        },
      })
    )
  );
  return {
    dispatch: store.dispatch,
    getState() {
      return store.getState().pipelineBuilder.stageEditor;
    },
    pipelineBuilder,
    dataService,
  };
}

describe('stageEditor', function () {
  let store: ReturnType<typeof createStore>;

  beforeEach(function () {
    store = createStore({});
  });

  describe('changeStageOperator', function () {
    context('when there are no wizards in state', function () {
      it('should update stage operator', function () {
        expect(store.getState().stages[1]).to.have.property(
          'stageOperator',
          '$limit'
        );

        store.dispatch(changeStageOperator(1, '$project'));

        expect(store.getState().stages[1]).to.have.property(
          'stageOperator',
          '$project'
        );

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(store.pipelineBuilder.getStage).to.be.calledWithExactly(1);
      });
    });

    context(
      'when there are wizards in state and item at index is a stage',
      function () {
        beforeEach(function () {
          store = createStore({ stages: PIPELINE_WITH_WIZARDS });
        });

        context('and item at index is stage', function () {
          it('should update stage operator', function () {
            const idxToBeUpdated = 4;
            const pipelineIdxToBeUpdated = 2;
            expect(store.getState().stages[idxToBeUpdated]).to.have.property(
              'stageOperator',
              '$out'
            );

            store.dispatch(changeStageOperator(idxToBeUpdated, '$project'));

            expect(store.getState().stages[idxToBeUpdated]).to.have.property(
              'stageOperator',
              '$project'
            );

            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(store.pipelineBuilder.getStage).to.be.calledWithExactly(
              pipelineIdxToBeUpdated
            );
          });
        });

        context('and item at index is a wizard', function () {
          it('should not do anything', function () {
            store.dispatch(changeStageOperator(2, '$match'));

            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(store.pipelineBuilder.getStage).to.not.be.called;
          });
        });
      }
    );

    it('should return stage snippet when stage was in initial state', function () {
      // Adding a new empty stage
      store.dispatch(addStage());
      const { stages } = store.getState();
      const snippet = store.dispatch(
        changeStageOperator(stages.length - 1, '$match')
      );
      expect(snippet).to.eq(
        `/**
 * query: The query in MQL.
 */
{
  \${1:query}
}`
      );
    });

    it('should return new stage snippet if the old snippet was not changed', function () {
      // Adding a new empty stage
      store.dispatch(addStage());
      const { stages } = store.getState();
      store.dispatch(changeStageOperator(stages.length - 1, '$match'));
      const snippet = store.dispatch(
        changeStageOperator(stages.length - 1, '$limit')
      );
      expect(snippet).to.eq(
        `/**
 * Provide the number of documents to limit.
 */
\${1:number}`
      );
    });

    it('should not return stage snippet if stage was changed before switching the operators', function () {
      store.dispatch(addStage());
      let stages = store.getState().stages;
      store.dispatch(changeStageOperator(stages.length - 1, '$match'));
      store.dispatch(changeStageValue(stages.length - 1, '{ _id: 1 }'));
      const snippet = store.dispatch(
        changeStageOperator(stages.length - 1, '$limit')
      );
      expect(snippet).to.eq(undefined);
      stages = store.getState().stages;
      expect(stages[stages.length - 1]).to.have.property('value', '{ _id: 1 }');
    });

    it('should not return stage snippet if stage value was changed without changing operator first', function () {
      store.dispatch(addStage());
      const { stages } = store.getState();
      store.dispatch(changeStageValue(stages.length - 1, '321'));
      const snippet = store.dispatch(
        changeStageOperator(stages.length - 1, '$match')
      );
      expect(snippet).to.eq(undefined);
      expect(store.getState().stages[stages.length - 1]).to.have.property(
        'value',
        '321'
      );
    });

    it('returns auto-embed $vectorSearch snippet when public preview is enabled', function () {
      store = createStore({
        preferences: createPreferencesWithAutoEmbedPreview(true),
      });
      store.dispatch(addStage());
      const { stages } = store.getState();
      const snippet = store.dispatch(
        changeStageOperator(stages.length - 1, '$vectorSearch')
      );
      expect(snippet).to.include('// query:');
    });

    it('returns standard $vectorSearch snippet when public preview is disabled', function () {
      store = createStore({
        preferences: createPreferencesWithAutoEmbedPreview(false),
      });
      store.dispatch(addStage());
      const { stages } = store.getState();
      const snippet = store.dispatch(
        changeStageOperator(stages.length - 1, '$vectorSearch')
      );
      expect(snippet).not.to.include('// query:');
      expect(snippet).to.include('queryVector:');
    });
  });

  describe('changeStageValue', function () {
    [
      {
        contextTitle: 'when there are no wizards in state',
        stages: PIPELINE,
        idx: 2,
        idxInPipeline: 2,
      },
      {
        contextTitle: 'when there are wizards in state',
        stages: PIPELINE_WITH_WIZARDS,
        idx: 4,
        idxInPipeline: 2,
      },
    ].forEach(function ({ contextTitle, stages, idx, idxInPipeline }) {
      context(contextTitle, function () {
        it('should update stage value', function () {
          const store = createStore({ stages });
          expect(store.getState().stages[idx]).to.have.property(
            'value',
            '"match-and-limit"'
          );

          store.dispatch(changeStageValue(idx, '{_id: 2}'));

          expect(store.getState().stages[idx]).to.have.property(
            'value',
            '{_id: 2}'
          );

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.getStage).to.be.calledWithExactly(
            idxInPipeline
          );
        });
      });
    });
  });

  describe('changeStageCollapsed', function () {
    it('should update stage collapsed state', function () {
      expect(store.getState().stages[0]).to.have.property('collapsed', false);

      store.dispatch(changeStageCollapsed(0, true));

      expect(store.getState().stages[0]).to.have.property('collapsed', true);
    });
  });

  describe('changeStageDisabled', function () {
    [
      {
        contextTitle: 'when there are no wizards in state',
        stages: PIPELINE,
        idx: 1,
        idxInPipeline: 1,
      },
      {
        contextTitle: 'when there are wizards in state',
        stages: PIPELINE_WITH_WIZARDS,
        idx: 4,
        idxInPipeline: 2,
      },
    ].forEach(function ({ contextTitle, stages, idx, idxInPipeline }) {
      context(contextTitle, function () {
        it('should update stage disabled state', function () {
          const store = createStore({ stages });
          expect(store.getState().stages[idx]).to.have.property(
            'disabled',
            false
          );

          store.dispatch(changeStageDisabled(idx, true));

          expect(store.getState().stages[idx]).to.have.property(
            'disabled',
            true
          );

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.getStage).to.be.calledWithExactly(
            idxInPipeline
          );
        });
      });
    });
  });

  describe('addStage', function () {
    [
      {
        contextTitle: 'when there are no wizards in state',
        stages: PIPELINE,
        // Hard coded based on the number of wizards
        // added in create store method.
        expectedStoreStagesLength: 3,
        expectedPipelineLength: 3,
      },
      {
        contextTitle: 'when there are wizards in state',
        stages: PIPELINE_WITH_WIZARDS,
        expectedStoreStagesLength: 6,
        expectedPipelineLength: 3,
      },
    ].forEach(function ({
      contextTitle,
      stages,
      expectedStoreStagesLength,
      expectedPipelineLength,
    }) {
      context(contextTitle, function () {
        it('should add stage at the end of the pipeline when no argument provided', function () {
          const store = createStore({ stages });
          expect(store.getState().stages).to.have.lengthOf(
            expectedStoreStagesLength
          );

          store.dispatch(addStage());

          expect(store.getState().stages).to.have.lengthOf(
            expectedStoreStagesLength + 1
          );

          expect(store.pipelineBuilder.stages).to.have.lengthOf(
            expectedPipelineLength + 1
          );
        });
      });
    });

    [
      {
        contextTitle: 'when there are no wizards in state',
        stages: PIPELINE,
        afterIdx: 1,
        afterIdxInPipeline: 1,
      },
      {
        contextTitle: 'when there are no wizards in state and afterIdx is -1',
        stages: PIPELINE,
        afterIdx: -1,
        afterIdxInPipeline: -1,
      },
      {
        contextTitle: 'when there are wizards in state and afterIdx is -1',
        stages: PIPELINE_WITH_WIZARDS,
        afterIdx: -1,
        afterIdxInPipeline: -1,
      },
      {
        contextTitle:
          'when there are wizards in state and item at after index is a stage',
        stages: PIPELINE_WITH_WIZARDS,
        afterIdx: 4,
        afterIdxInPipeline: 2,
      },
      {
        contextTitle:
          'when there are wizards in state and item at after index is a wizard',
        stages: PIPELINE_WITH_WIZARDS,
        afterIdx: 2,
        afterIdxInPipeline: 1,
      },
    ].forEach(function ({
      afterIdx,
      contextTitle,
      stages,
      afterIdxInPipeline,
    }) {
      context(contextTitle, function () {
        it('should add stage after index in state and in pipeline', function () {
          const store = createStore({ stages });
          expect(store.getState().stages).to.have.lengthOf(
            store.getState().stages.length
          );

          store.dispatch(addStage(afterIdx));

          expect(store.getState().stages).to.have.lengthOf(
            store.getState().stages.length
          );
          expect(store.getState().stages[afterIdx + 1]).to.have.property(
            'stageOperator',
            null
          );
          expect(store.getState().stages[afterIdx + 1]).to.have.property(
            'value',
            null
          );

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.addStage).to.be.calledWithExactly(
            afterIdxInPipeline
          );
        });
      });
    });
  });

  describe('addSearchStageBefore', function () {
    it('inserts a $search stage before a first-stage $rerank (storeIndex 0)', function () {
      const store = createStore({
        pipelineSource: '[{$rerank: {}}]',
        stages: [RERANK_STAGE],
      });
      store.dispatch(addSearchStageBefore(0));
      const stages = store.getState().stages.filter((s) => s.type === 'stage');
      expect(stages).to.have.lengthOf(2);
      expect(stages[0]).to.have.property('stageOperator', '$search');
      expect(stages[1]).to.have.property('stageOperator', '$rerank');
    });

    it('inserts a $search stage before $rerank at a non-zero index', function () {
      const store = createStore({
        pipelineSource: '[{$match: {}}, {$rerank: {}}]',
        stages: [MATCH_STAGE, { ...RERANK_STAGE, idxInPipeline: 1 }],
      });
      store.dispatch(addSearchStageBefore(1));
      const stages = store.getState().stages.filter((s) => s.type === 'stage');
      expect(stages).to.have.lengthOf(3);
      expect(stages[0]).to.have.property('stageOperator', '$match');
      expect(stages[1]).to.have.property('stageOperator', '$search');
      expect(stages[2]).to.have.property('stageOperator', '$rerank');
    });
  });

  describe('moveStage', function () {
    context('when there are no wizards in state', function () {
      it('should move the stage in store and also in pipeline', function () {
        [
          {
            fromIdx: 0,
            toIdx: 2,
          },
          /* Moving back the stage */ {
            fromIdx: 2,
            toIdx: 0,
          },
        ].forEach(function ({ fromIdx, toIdx }) {
          expect(store.getState().stages[fromIdx]).to.have.property(
            'stageOperator',
            '$match'
          );

          store.dispatch(moveStage(fromIdx, toIdx));

          expect(store.getState().stages[toIdx]).to.have.property(
            'stageOperator',
            '$match'
          );

          expect(
            // eslint-disable-next-line @typescript-eslint/unbound-method
            store.pipelineBuilder.moveStage
          ).to.have.been.calledWithExactly(fromIdx, toIdx);
        });
      });
    });

    context('when there are wizards in state', function () {
      beforeEach(function () {
        store = createStore({ stages: PIPELINE_WITH_WIZARDS });
      });
      context('and item at fromIdx is a stage', function () {
        context('and item at toIdx is also a stage', function () {
          it('should move the stage in store and also in pipeline', function () {
            [
              {
                fromIdx: 1,
                fromIdxInPipeline: 1,
                toIdx: 4,
                toIdxInPipeline: 2,
              },
              /* moving back the stage */ {
                fromIdx: 4,
                fromIdxInPipeline: 2,
                toIdx: 1,
                toIdxInPipeline: 1,
              },
            ].forEach(function ({
              fromIdx,
              fromIdxInPipeline,
              toIdx,
              toIdxInPipeline,
            }) {
              expect(store.getState().stages[fromIdx]).to.have.property(
                'stageOperator',
                '$limit'
              );

              store.dispatch(moveStage(fromIdx, toIdx));

              expect(store.getState().stages[toIdx]).to.have.property(
                'stageOperator',
                '$limit'
              );

              expect(
                // eslint-disable-next-line @typescript-eslint/unbound-method
                store.pipelineBuilder.moveStage
              ).to.have.been.calledWithExactly(
                fromIdxInPipeline,
                toIdxInPipeline
              );
            });
          });
        });
        context(
          'and there are stages in between fromIdx and toIdx(excluding)',
          function () {
            it('should move the stage in store and also in pipeline', function () {
              [
                {
                  fromIdx: 1,
                  fromIdxInPipeline: 1,
                  toIdx: 5,
                  toIdxInPipeline: 2,
                },
                /* moving back the stage */ {
                  fromIdx: 5,
                  fromIdxInPipeline: 2,
                  toIdx: 1,
                  toIdxInPipeline: 1,
                },
              ].forEach(function ({
                fromIdx,
                fromIdxInPipeline,
                toIdx,
                toIdxInPipeline,
              }) {
                expect(store.getState().stages[fromIdx]).to.have.property(
                  'stageOperator',
                  '$limit'
                );
                expect(store.getState().stages[toIdx]).to.have.property(
                  'type',
                  'wizard'
                );

                store.dispatch(moveStage(fromIdx, toIdx));

                expect(store.getState().stages[fromIdx]).to.have.property(
                  'type',
                  'wizard'
                );
                expect(store.getState().stages[toIdx]).to.have.property(
                  'stageOperator',
                  '$limit'
                );

                expect(
                  // eslint-disable-next-line @typescript-eslint/unbound-method
                  store.pipelineBuilder.moveStage
                ).to.have.been.calledWithExactly(
                  fromIdxInPipeline,
                  toIdxInPipeline
                );
              });
            });
          }
        );
        context(
          'and there no stages in between fromIdx and toIdx(including)',
          function () {
            it('should move the stage in store but should do nothing in pipeline', function () {
              [
                {
                  fromIdx: 1,
                  toIdx: 3,
                },
                /* Moving back the stage */ {
                  fromIdx: 3,
                  toIdx: 1,
                },
              ].forEach(function ({ fromIdx, toIdx }) {
                expect(store.getState().stages[fromIdx]).to.have.property(
                  'stageOperator',
                  '$limit'
                );

                store.dispatch(moveStage(fromIdx, toIdx));

                expect(store.getState().stages[toIdx]).to.have.property(
                  'stageOperator',
                  '$limit'
                );

                // eslint-disable-next-line @typescript-eslint/unbound-method
                expect(store.pipelineBuilder.moveStage).to.not.have.been.called;
              });
            });
          }
        );
      });
      context('and item at fromIdx is a wizard', function () {
        it('should move the stage in store but should do nothing in pipeline', function () {
          [
            {
              fromIdx: 5,
              toIdx: 1,
            },
            /* Moving back the stage */ {
              fromIdx: 1,
              toIdx: 5,
            },
          ].forEach(function ({ fromIdx, toIdx }) {
            expect(store.getState().stages[fromIdx]).to.have.property(
              'type',
              'wizard'
            );

            store.dispatch(moveStage(fromIdx, toIdx));

            expect(store.getState().stages[toIdx]).to.have.property(
              'type',
              'wizard'
            );

            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(store.pipelineBuilder.moveStage).to.not.have.been.called;
          });
        });
      });
    });
  });

  describe('removeStage', function () {
    [
      {
        contextTitle: 'when there are no wizards in state',
        stages: PIPELINE,
        removeAt: 0,
        expectedLength: 3,
      },
      {
        contextTitle: 'when there are wizards in state',
        stages: PIPELINE_WITH_WIZARDS,
        removeAt: 0,
        expectedLength: 6,
      },
    ].forEach(({ contextTitle, stages, removeAt, expectedLength }) => {
      context(contextTitle, function () {
        it('should remove stage from store as well as pipeline', function () {
          const store = createStore({ stages });
          expect(store.getState().stages).to.have.lengthOf(expectedLength);
          expect(store.getState().stages[removeAt]).to.have.property(
            'stageOperator',
            '$match'
          );

          store.dispatch(removeStage(removeAt));

          expect(store.getState().stages).to.have.lengthOf(expectedLength - 1);
          expect(store.getState().stages[removeAt]).to.have.property(
            'stageOperator',
            '$limit'
          );

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.removeStage).to.be.calledWithExactly(
            removeAt
          );
          expect(store.pipelineBuilder.stages[removeAt]).to.have.property(
            'operator',
            '$limit'
          );
        });
      });
    });
  });

  describe('loadStagePreview', function () {
    [
      {
        contextTitle: 'when there are no wizards in state',
        stages: PIPELINE,
      },
      {
        contextTitle: 'when there are wizards in state',
        stages: PIPELINE_WITH_WIZARDS,
      },
    ].forEach(({ contextTitle, stages }, index) => {
      context(contextTitle, function () {
        beforeEach(function () {
          store = createStore({ stages });
        });

        if (index === 1) {
          it('should do nothing if the provided index is of a wizard', async function () {
            await store.dispatch(loadStagePreview(2));
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(store.pipelineBuilder.getPreviewForStage).not.to.be.called;
          });
        }

        it('should load preview for valid stage', async function () {
          await store.dispatch(loadStagePreview(0));
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.getPreviewForStage).to.be.calledOnce;
        });

        it('should not load preview for disabled stage', async function () {
          store.dispatch(changeStageDisabled(0, true));
          Sinon.resetHistory();
          await store.dispatch(loadStagePreview(0));
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.getPreviewForStage).not.to.be.called;
        });

        it('should not load preview for invalid stage', async function () {
          store.dispatch(changeStageValue(0, '{ foo: '));
          Sinon.resetHistory();
          await store.dispatch(loadStagePreview(0));
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.getPreviewForStage).not.to.be.called;
        });

        it('should not load preview for stage if any previous stages are invalid', async function () {
          store.dispatch(changeStageValue(0, '{ foo: '));
          Sinon.resetHistory();
          await store.dispatch(loadStagePreview(1));
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.getPreviewForStage).not.to.be.called;
        });

        it('should load preview for stage if invalid previous stages are disabled', async function () {
          store.dispatch(changeStageValue(0, '{ foo: '));
          store.dispatch(changeStageDisabled(0, true));
          Sinon.resetHistory();
          await store.dispatch(loadStagePreview(1));
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.getPreviewForStage).to.be.called;
        });

        it('should cancel preview for stage when new stage state is invalid', function () {
          store.dispatch(changeStageValue(0, '{ foo: 1 }'));
          Sinon.resetHistory();
          store.dispatch(changeStageValue(0, '{ foo: '));
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(store.pipelineBuilder.getPreviewForStage).not.to.be.called;
          expect(
            // eslint-disable-next-line @typescript-eslint/unbound-method
            store.pipelineBuilder.cancelPreviewForStage
          ).to.have.been.calledThrice; // Three times for three stages in the pipeline
        });
      });
    });

    describe('when fetching $search stage metadata', function () {
      const PREVIEW_DEBOUNCE_MS = 700;
      const scoreDetails = {
        value: 0.9,
        description: 'text score',
        details: [],
      };
      const previewDocs: Document[] = [{ _id: 1, title: 'foo' }];
      const SEARCH_PIPELINE_SOURCE = `[{$search: {text: {query: "foo", path: "title"}}}]`;

      afterEach(function () {
        Sinon.restore();
      });

      function createSearchPreviewStore({
        enableSearchActivationProgramP2 = true,
        stages = [SEARCH_STAGE],
        pipelineSource = SEARCH_PIPELINE_SOURCE,
        dataService = mockDataService(),
      }: {
        enableSearchActivationProgramP2?: boolean;
        stages?: StageEditorState['stages'];
        pipelineSource?: string;
        dataService?: DataService;
      } = {}) {
        return createStore({
          stages,
          pipelineSource,
          preferences: createPreferencesWithSearchActivationProgramP2(
            enableSearchActivationProgramP2
          ),
          dataService,
        });
      }

      function getStoreStage(
        searchStore: ReturnType<typeof createSearchPreviewStore>,
        idx: number
      ): StoreStage {
        return searchStore.getState().stages[idx] as StoreStage;
      }

      function stubPreviewDocs(
        searchStore: ReturnType<typeof createSearchPreviewStore>,
        docs: Document[] = previewDocs
      ) {
        Sinon.replace(
          searchStore.pipelineBuilder,
          'getPreviewForStage',
          Sinon.fake.resolves(docs)
        );
      }

      function replaceAggregate(
        dataService: DataService,
        implementation: (...args: unknown[]) => Promise<unknown[]>
      ) {
        const aggregate = Sinon.fake(implementation);
        Sinon.replace(dataService, 'aggregate', aggregate);
        return aggregate;
      }

      it('fetches metadata after preview and stores scores when flag is enabled', async function () {
        const dataService = mockDataService();
        const aggregate = replaceAggregate(dataService, () =>
          Promise.resolve([{ type: '$search', scores: scoreDetails }])
        );
        const searchStore = createSearchPreviewStore({ dataService });
        stubPreviewDocs(searchStore);

        await searchStore.dispatch(loadStagePreview(0));

        expect(aggregate).to.have.been.calledOnce;
        expect(getStoreStage(searchStore, 0).stageMetadata).to.deep.equal({
          type: '$search',
          scores: [scoreDetails],
        });
        expect(getStoreStage(searchStore, 0).previewDocs).to.have.lengthOf(1);
      });

      it('fetches metadata only after preview debounce settles', async function () {
        const clock = Sinon.useFakeTimers();
        const dataService = mockDataService();
        const aggregate = replaceAggregate(dataService, () =>
          Promise.resolve([{ type: '$search', scores: scoreDetails }])
        );
        const searchStore = createSearchPreviewStore({ dataService });

        const first = searchStore.dispatch(loadStagePreview(0));
        await clock.tickAsync(200);
        const second = searchStore.dispatch(loadStagePreview(0));
        await clock.tickAsync(PREVIEW_DEBOUNCE_MS);
        await Promise.allSettled([first, second]);
        clock.restore();

        // One preview aggregate and one metadata aggregate for the last request.
        expect(aggregate).to.have.been.calledTwice;
      });

      it('does not dispatch stale metadata when a newer preview load cancels it', async function () {
        const clock = Sinon.useFakeTimers();
        const latestScore = {
          value: 0.9,
          description: 'latest',
          details: [],
        };
        let metadataCallCount = 0;
        const dataService = mockDataService();
        replaceAggregate(dataService, () => {
          metadataCallCount += 1;
          return Promise.resolve([{ type: '$search', scores: latestScore }]);
        });
        const searchStore = createSearchPreviewStore({ dataService });

        const first = searchStore.dispatch(loadStagePreview(0));
        await clock.tickAsync(200);
        const second = searchStore.dispatch(loadStagePreview(0));
        await clock.tickAsync(PREVIEW_DEBOUNCE_MS);
        await Promise.allSettled([first, second]);
        clock.restore();

        // One preview aggregate and one metadata aggregate for the last request.
        expect(metadataCallCount).to.equal(2);
        expect(getStoreStage(searchStore, 0).stageMetadata).to.deep.equal({
          type: '$search',
          scores: [latestScore],
        });
      });

      it('does not fetch metadata when search activation flag is disabled', async function () {
        const dataService = mockDataService();
        const aggregate = replaceAggregate(dataService, () =>
          Promise.resolve([])
        );
        const searchStore = createSearchPreviewStore({
          enableSearchActivationProgramP2: false,
          dataService,
        });
        stubPreviewDocs(searchStore);

        await searchStore.dispatch(loadStagePreview(0));

        expect(aggregate).not.to.have.been.called;
        expect(getStoreStage(searchStore, 0).stageMetadata).to.be.null;
      });

      it('does not fetch metadata when $search is not the only stage in preview', async function () {
        const searchAsSecondStage = mapBuilderStageToStoreStage(
          {
            id: 6,
            operator: '$search',
            value: '{ text: { query: "foo", path: "title" } }',
            syntaxError: null,
            disabled: false,
            isEmpty: false,
          } as Stage,
          1
        );
        const dataService = mockDataService();
        const aggregate = replaceAggregate(dataService, () =>
          Promise.resolve([])
        );
        const searchStore = createSearchPreviewStore({
          stages: [MATCH_STAGE, searchAsSecondStage],
          pipelineSource:
            '[{$match: {_id: 1}}, {$search: {text: {query: "foo", path: "title"}}}]',
          dataService,
        });
        stubPreviewDocs(searchStore);

        await searchStore.dispatch(loadStagePreview(1));

        expect(aggregate).not.to.have.been.called;
        expect(getStoreStage(searchStore, 1).stageMetadata).to.be.null;
      });

      it('completes preview with null metadata when metadata aggregate fails', async function () {
        const dataService = mockDataService();
        replaceAggregate(dataService, () =>
          Promise.reject(new Error('metadata failed'))
        );
        const searchStore = createSearchPreviewStore({ dataService });
        stubPreviewDocs(searchStore);

        await searchStore.dispatch(loadStagePreview(0));

        expect(getStoreStage(searchStore, 0).stageMetadata).to.be.null;
        expect(getStoreStage(searchStore, 0).previewDocs).to.have.lengthOf(1);
      });

      it('stores null metadata when metadata documents have no score details', async function () {
        const dataService = mockDataService();
        replaceAggregate(dataService, () => Promise.resolve([{ _id: 1 }]));
        const searchStore = createSearchPreviewStore({ dataService });
        stubPreviewDocs(searchStore);

        await searchStore.dispatch(loadStagePreview(0));

        expect(getStoreStage(searchStore, 0).stageMetadata).to.be.null;
      });

      it('builds scores from metadata documents', async function () {
        const middleScore = {
          value: 0.5,
          description: 'middle',
          details: [],
        };
        const dataService = mockDataService();
        replaceAggregate(dataService, () =>
          Promise.resolve([
            { type: '$search' },
            { type: '$search', scores: middleScore },
            { type: '$search' },
          ])
        );
        const searchStore = createSearchPreviewStore({ dataService });
        stubPreviewDocs(searchStore, [{ _id: 1 }, { _id: 2 }, { _id: 3 }]);

        await searchStore.dispatch(loadStagePreview(0));

        expect(getStoreStage(searchStore, 0).stageMetadata).to.deep.equal({
          type: '$search',
          scores: [null, middleScore, null],
        });
      });
    });

    describe('didReturnDocs gating for $rerank first-stage banner', function () {
      const RERANK_PIPELINE_SOURCE = `[{$rerank: {}}]`;

      function createRerankStore() {
        return createStore({
          stages: [RERANK_STAGE],
          pipelineSource: RERANK_PIPELINE_SOURCE,
        });
      }

      function dispatchPreviewSuccess(
        s: ReturnType<typeof createStore>,
        docs: Document[] = []
      ) {
        s.dispatch({
          type: StageEditorActionTypes.StagePreviewFetchSuccess,
          id: 0,
          previewDocs: docs.map((doc) => new HadronDocument(doc)),
          stageMetadata: null,
        });
      }

      it('is false before any preview runs', function () {
        const store = createRerankStore();
        expect((store.getState().stages[0] as StoreStage).didReturnDocs).to.be
          .false;
      });

      it('becomes true after StagePreviewFetchSuccess with docs', function () {
        const store = createRerankStore();
        dispatchPreviewSuccess(store, [{ _id: 1 }]);
        expect((store.getState().stages[0] as StoreStage).didReturnDocs).to.be
          .true;
      });

      it('stays true when a subsequent preview returns empty docs', function () {
        const store = createRerankStore();
        dispatchPreviewSuccess(store, [{ _id: 1 }]);
        dispatchPreviewSuccess(store, []);
        expect((store.getState().stages[0] as StoreStage).didReturnDocs).to.be
          .true;
      });

      it('resets to false when stage operator changes', function () {
        const store = createRerankStore();
        dispatchPreviewSuccess(store, [{ _id: 1 }]);
        store.dispatch(changeStageOperator(0, '$match'));
        expect((store.getState().stages[0] as StoreStage).didReturnDocs).to.be
          .false;
      });
    });
  });

  describe('runStage', function () {
    [
      {
        contextTitle: 'when there are no wizards in state',
        stages: PIPELINE,
        idxToRun: 2,
        idxToRunInPipeline: 2,
        invalidIdx: 1,
      },
      {
        contextTitle: 'when there are wizards in state',
        stages: PIPELINE_WITH_WIZARDS,
        idxToRun: 4,
        idxToRunInPipeline: 2,
        invalidIdx: 1,
      },
    ].forEach(
      ({ contextTitle, stages, idxToRun, invalidIdx, idxToRunInPipeline }) => {
        context(contextTitle, function () {
          beforeEach(function () {
            store = createStore({ stages });
          });

          it('should not run aggregation for disabled stage', async function () {
            store.dispatch(changeStageDisabled(idxToRun, true));
            Sinon.resetHistory();
            await store.dispatch(runStage(idxToRun));
            expect(
              // eslint-disable-next-line @typescript-eslint/unbound-method
              store.pipelineBuilder.getPipelineFromStages
            ).not.to.be.called;
          });

          it('should not run aggregation if any previous stages are invalid', async function () {
            store.dispatch(changeStageValue(invalidIdx, '{ foo: '));
            Sinon.resetHistory();
            await store.dispatch(runStage(idxToRun));
            expect(
              // eslint-disable-next-line @typescript-eslint/unbound-method
              store.pipelineBuilder.getPipelineFromStages
            ).not.to.be.called;
          });

          it('should run aggregation if invalid previous stages are disabled', async function () {
            const store = createStore({ stages });
            store.dispatch(changeStageValue(invalidIdx, '{ foo: '));
            store.dispatch(changeStageDisabled(invalidIdx, true));
            Sinon.resetHistory();
            await store.dispatch(runStage(idxToRun));
            expect(
              // eslint-disable-next-line @typescript-eslint/unbound-method
              store.pipelineBuilder.getPipelineFromStages
            ).to.be.calledWithExactly(
              store.pipelineBuilder.stages.slice(0, idxToRunInPipeline + 1)
            );
          });
        });
      }
    );
  });

  describe('addWizard', function () {
    it('adds a wizard to the end of the stages when no index is provided', function () {
      expect(store.getState().stages).to.have.lengthOf(3);

      store.dispatch(addWizard('sort', '$sort'));

      expect(store.getState().stages).to.have.lengthOf(4);
      expect(store.pipelineBuilder.stages).to.have.lengthOf(3);
    });

    it('adds a wizard at the provided index', function () {
      expect(store.getState().stages).to.have.lengthOf(3);

      store.dispatch(addWizard('sort', '$sort', 1));

      expect(store.getState().stages[2].type).to.equal('wizard');
      expect(store.getState().stages).to.have.lengthOf(4);
      expect(store.pipelineBuilder.stages).to.have.lengthOf(3);
    });
  });

  describe('updateWizardValue', function () {
    it('modifies the form values of wizard if there is a wizard at provided index', function () {
      store.dispatch(addWizard('sort', '$sort'));
      store.dispatch(updateWizardValue(3, JSON.stringify({ name: 'Test' })));

      const itemAtIndex = store.getState().stages[3];
      expect(itemAtIndex.type).to.equal('wizard');
      expect((itemAtIndex as Wizard).value).to.deep.equal(
        JSON.stringify({ name: 'Test' })
      );
    });

    it('validates the wizard value', function () {
      store.dispatch(addWizard('sort', '$sort'));
      store.dispatch(updateWizardValue(3, `{ name: value }`));

      const itemAtIndex = store.getState().stages[3] as Wizard;
      expect(itemAtIndex.type).to.equal('wizard');
      expect(itemAtIndex.value).to.equal(`{ name: value }`);
      expect(itemAtIndex.syntaxError?.message).to.equal(
        'Source expression is invalid'
      );
    });

    it('does nothing if item at provided index is not a wizard', function () {
      store.dispatch(updateWizardValue(0, JSON.stringify({ name: 'Test' })));

      const itemAtIndex = store.getState().stages[0];
      expect((itemAtIndex as any).formValues).to.be.undefined;
    });
  });

  describe('convertWizardToStage', function () {
    it('converts wizard to stage', function () {
      store.dispatch(addWizard('sort', '$sort'));
      store.dispatch(updateWizardValue(3, '{ name: -1 }'));

      const wizard = store.getState().stages[3] as Wizard;
      expect(wizard.type).to.equal('wizard');
      expect(wizard.value).to.deep.equal('{ name: -1 }');
      expect(wizard.syntaxError).to.be.null;

      store.dispatch(convertWizardToStage(3));

      const stage = store.getState().stages[3] as StoreStage;
      expect(stage.type).to.equal('stage');
      expect(stage.stageOperator).to.equal('$sort');
      expect(stage.value).to.deep.equal('{ name: -1 }');
    });

    it('does nothing if item at provided index is not a wizard', function () {
      store.dispatch(convertWizardToStage(0));
      const itemAtIndex = store.getState().stages[0];
      expect(itemAtIndex.type).to.equal('stage');
    });

    it('does nothing if wizard has error', function () {
      store.dispatch(addWizard('sort', '$sort'));
      store.dispatch(updateWizardValue(3, '{ name: something }'));

      store.dispatch(convertWizardToStage(3));

      const wizard = store.getState().stages[3] as Wizard;
      expect(wizard.type).to.equal('wizard');
      expect(wizard.syntaxError).to.not.be.null;
    });
  });
});
