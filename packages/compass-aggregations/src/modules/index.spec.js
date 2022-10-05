import reducer, {
  reset,
  clearPipeline,
  restoreSavedPipeline,
  clonePipeline,
  newPipeline,
  makeViewPipeline,
  RESET,
  CLEAR_PIPELINE,
  RESTORE_PIPELINE,
  NEW_PIPELINE,
  CLONE_PIPELINE,
} from './';
import { toggleOverview, TOGGLE_OVERVIEW } from './is-overview-on';
import { largeLimitChanged, LARGE_LIMIT_CHANGED } from './large-limit';
import { limitChanged, LIMIT_CHANGED } from './limit';
import {
  maxTimeMSChanged,
  MAX_TIME_MS_CHANGED
} from './max-time-ms';
import { expect } from 'chai';

describe('root [ module ]', function() {
  describe('#reset', function() {
    it('returns the action', function() {
      expect(reset()).to.deep.equal({
        type: RESET
      });
    });
  });

  describe('#clearPipeline', function() {
    it('returns the action', function() {
      expect(clearPipeline()).to.deep.equal({
        type: CLEAR_PIPELINE
      });
    });
  });

  describe('#restoreSavedPipeline', function() {
    it('returns the action', function() {
      expect(restoreSavedPipeline({ name: 'test' })).to.deep.equal({
        type: RESTORE_PIPELINE,
        restoreState: { name: 'test' }
      });
    });
  });

  describe('#newPipeline', function() {
    it('returns the NEW_PIPELINE action', function() {
      expect(newPipeline()).to.deep.equal({
        type: NEW_PIPELINE
      });
    });
  });

  describe('#clonePipeline', function() {
    it('returns the CLONE_PIPELINE action', function() {
      expect(clonePipeline()).to.deep.equal({
        type: CLONE_PIPELINE
      });
    });
  });

  describe('#toggleOverview', function() {
    it('returns the TOGGLE_OVERVIEW action', function() {
      expect(toggleOverview()).to.deep.equal({
        type: TOGGLE_OVERVIEW
      });
    });
  });

  describe('#maxTimeMS', function() {
    it('returns the MAX_TIME_MS_CHANGED action', function() {
      expect(maxTimeMSChanged(100)).to.deep.equal({
        type: MAX_TIME_MS_CHANGED,
        maxTimeMS: 100
      });
    });
  });

  describe('#limit', function() {
    it('returns the LIMIT_CHANGED action', function() {
      expect(limitChanged(100)).to.deep.equal({
        type: LIMIT_CHANGED,
        limit: 100
      });
    });
  });

  describe('#largeLimit', function() {
    it('returns the LARGE_LIMIT_CHANGED action', function() {
      expect(largeLimitChanged(100)).to.deep.equal({
        type: LARGE_LIMIT_CHANGED,
        largeLimit: 100
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is NEW_PIPELINE', function() {
      const prevState = {
        dataService: 'test-ds',
        namespace: 'test.test',
        fields: 'test-fields',
        serverVersion: '3.6.0',
        inputDocuments: {
          documents: []
        }
      };

      let state;

      before(function() {
        state = reducer(prevState, newPipeline());
      });

      it('keeps the data service', function() {
        expect(state.dataService).to.equal('test-ds');
      });

      it('keeps the namespace', function() {
        expect(state.namespace).to.equal('test.test');
      });

      it('keeps the fields', function() {
        expect(state.fields).to.equal('test-fields');
      });

      it('keeps the server version', function() {
        expect(state.serverVersion).to.equal('3.6.0');
      });

      it('keeps the input documents', function() {
        expect(state.inputDocuments).to.deep.equal({ documents: [] });
      });

      it('sets id to null', function() {
        expect(state.id).to.equal('');
      });
    });

    context('when the action is CLONE_PIPELINE', function() {
      const prevState = {
        id: 'testing',
        name: 'test'
      };

      let state;

      before(function() {
        state = reducer(prevState, clonePipeline());
      });

      it('sets id to a new id', function() {
        expect(state.id).to.not.equal('testing');
      });

      it('updates the name', function() {
        expect(state.name).to.equal('test (copy)');
      });
    });

    describe('when the action is TOGGLE_OVERVIEW', function() {
      describe('#overview', function() {
        const prevState = {
          isOverviewOn: false
        };

        let state;

        it('first toggle turns it on', function() {
          state = reducer(prevState, toggleOverview());
          expect(state.isOverviewOn).to.equal(true);
        });

        it('second toggle turns it back off', function() {
          state = reducer(state, toggleOverview());
          expect(state.isOverviewOn).to.equal(false);
        });
      });

      describe('#pipeline[].isExpanded', function() {
        const prevState = {
          isOverviewOn: false,
          pipeline: [
            {
              isExpanded: true
            }
          ]
        };

        let state;

        it('first toggle collapses the opened stage', function() {
          state = reducer(prevState, toggleOverview());
          expect(state.pipeline[0].isExpanded).to.equal(false);
        });

        it('second toggle expands the stage', function() {
          state = reducer(state, toggleOverview());
          expect(state.pipeline[0].isExpanded).to.equal(true);
        });
      });

      describe('#inputDocuments.isExpanded', function() {
        const prevState = {
          isOverviewOn: false,
          inputDocuments: {
            isExpanded: true,
            documents: []
          }
        };

        let state;

        it('first toggle collapses it', function() {
          state = reducer(prevState, toggleOverview());
          expect(state.inputDocuments.isExpanded).to.equal(false);
        });

        it('second toggle expands the stage', function() {
          state = reducer(state, toggleOverview());
          expect(state.inputDocuments.isExpanded).to.equal(true);
        });
      });
    });
  });

  describe('#makeViewPipeline', function() {
    it('filters out empty stages', function() {
      const pipeline = [
        // executor preferred
        { executor: { a: 1 } },

        // falling back to generateStage()
        { isEnabled: false}, // !isEnabled
        {}, // no stageOperator
        { stage: '' } // stage === ''
        // leaving out non-blank generated ones for generateStage()'s own unit tests
      ];

      expect(makeViewPipeline(pipeline)).to.deep.equal([{ a: 1 }]);
    });
  });
});
