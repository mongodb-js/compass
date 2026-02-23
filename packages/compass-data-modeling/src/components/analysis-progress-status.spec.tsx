import React from 'react';
import { expect } from 'chai';
import { screen, waitFor } from '@mongodb-js/testing-library-compass';
import AnalysisProgressStatus from './analysis-progress-status';
import { renderWithStore, testConnections } from '../../test/setup-store';
import {
  AnalysisProcessActionTypes,
  startAnalysis,
} from '../store/analysis-process';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

describe('AnalysisProgressStatus', () => {
  async function renderAnalysisProgressStatus({
    automaticallyInferRelations = false,
  } = {}) {
    const preferences = await createSandboxFromDefaultPreferences();
    const { store } = renderWithStore(<AnalysisProgressStatus />, {
      services: {
        preferences,
      },
    });
    void store.dispatch(
      startAnalysis(
        'My Diagram',
        testConnections[0].id,
        'testDB',
        ['coll1', 'coll2', 'coll3'],
        { automaticallyInferRelations, sampleSize: 100 }
      )
    );
    return store;
  }

  it('Allows cancellation', async () => {
    const store = await renderAnalysisProgressStatus();
    expect(screen.getByText('Sampling collections…')).to.be.visible;
    expect(screen.getByText('Cancel')).to.be.visible;
    screen.getByText('Cancel').click();
    await waitFor(() => {
      expect(store.getState().analysisProgress.step).to.equal('IDLE');
      expect(store.getState().diagram).to.be.null;
    });
  });

  describe('Keeps showing progress along the way', () => {
    it('Without relationship inferring', async () => {
      const store = await renderAnalysisProgressStatus({
        automaticallyInferRelations: false,
      });
      expect(screen.getByText('Sampling collections…')).to.be.visible;
      expect(screen.getByText('0/3')).to.be.visible;

      // 2 out of 3 samples fetched, 1 analyzed
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED,
      });
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED,
      });
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
      });

      expect(screen.getByText('Sampling collections…')).to.be.visible;
      expect(screen.getByText('2/3')).to.be.visible;

      // Last sample fetched
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED,
      });

      expect(screen.getByText('Analyzing collection schemas…')).to.be.visible;
      expect(screen.getByText('1/3')).to.be.visible;

      // Finish analyzing
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
      });
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
      });

      expect(screen.queryByText('Inferring relationships between collections…'))
        .not.to.exist;
      expect(screen.getByText('Preparing diagram…')).to.be.visible;
    });

    it('With relationship inferring', async () => {
      const store = await renderAnalysisProgressStatus({
        automaticallyInferRelations: true,
      });
      expect(screen.getByText('Sampling collections…')).to.be.visible;
      expect(screen.getByText('0/3')).to.be.visible;

      // Fetch and analyze all samples
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED,
      });
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED,
      });
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SAMPLE_FETCHED,
      });
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
      });
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
      });
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_SCHEMA_ANALYZED,
      });

      expect(screen.getByText('Inferring relationships between collections…'))
        .to.be.visible;
      expect(screen.queryByText('0/3')).not.to.exist;

      // Infer some relationships
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_RELATIONS_INFERRED,
      });
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_RELATIONS_INFERRED,
      });

      expect(screen.getByText('Inferring relationships between collections…'))
        .to.be.visible;
      expect(screen.queryByText('2/3')).not.to.exist;

      // Finish inferring
      store.dispatch({
        type: AnalysisProcessActionTypes.NAMESPACE_RELATIONS_INFERRED,
      });

      expect(screen.getByText('Preparing diagram…')).to.be.visible;
    });
  });
});
