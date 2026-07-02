import React from 'react';
import {
  screen,
  renderWithActiveConnection,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import ServerErrorBanner from './server-error-banner';
import { AssistantActionsContext } from '@mongodb-js/compass-assistant';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { ExperimentTestGroups } from '@mongodb-js/compass-telemetry';
import { wrapWithExperimentProvider } from '../../test/configure-store';

const CONNECTION: ConnectionInfo = {
  id: 'test',
  connectionOptions: { connectionString: 'mongodb://localhost:27017' },
};

const AI_PREFERENCES = {
  enableAIAssistant: true,
  enableGenAIFeatures: true,
  enableGenAIFeaturesAtlasOrg: true,
  cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
};

const ERROR_MESSAGE =
  'autocomplete index field definition not present at path title';

function renderBanner(
  props: Partial<React.ComponentProps<typeof ServerErrorBanner>> & {
    tellMoreAboutInsight?: sinon.SinonStub;
    withP2Experiment?: boolean;
  } = {},
  preferences: Record<string, unknown> = {}
) {
  const {
    tellMoreAboutInsight,
    withP2Experiment = false,
    ...bannerProps
  } = props;
  const actionsContext = {
    tellMoreAboutInsight: tellMoreAboutInsight ?? sinon.stub(),
  };

  const element = (
    <AssistantActionsContext.Provider value={actionsContext as any}>
      <ServerErrorBanner
        message={ERROR_MESSAGE}
        searchIndexName={null}
        dataTestId="test-banner"
        {...bannerProps}
      />
    </AssistantActionsContext.Provider>
  );

  return renderWithActiveConnection(
    withP2Experiment
      ? wrapWithExperimentProvider(
          element,
          ExperimentTestGroups.searchActivationProgramP2Variant
        )
      : element,
    CONNECTION,
    { preferences: { ...AI_PREFERENCES, ...preferences } }
  );
}

describe('ServerErrorBanner', function () {
  describe('Debug button', function () {
    it('shows the Debug button when assistant is enabled, P2 experiment is active, and stage context is provided', async function () {
      const tellMoreAboutInsight = sinon.stub();
      await renderBanner({
        tellMoreAboutInsight,
        stageOperator: '$search',
        stageValue: '{ "index": "default" }',
        withP2Experiment: true,
      });
      expect(screen.getByTestId('server-error-banner-debug-button')).to.exist;
    });

    it('does not show the Debug button when not in P2 experiment variant', async function () {
      const tellMoreAboutInsight = sinon.stub();
      await renderBanner({
        tellMoreAboutInsight,
        stageOperator: '$search',
        stageValue: '{ "index": "default" }',
        withP2Experiment: false,
      });
      expect(screen.queryByTestId('server-error-banner-debug-button')).to.not
        .exist;
    });

    it('does not show the Debug button for non-$search stages', async function () {
      const tellMoreAboutInsight = sinon.stub();
      for (const stageOperator of ['$match', '$vectorSearch', '$searchMeta']) {
        await renderBanner({
          tellMoreAboutInsight,
          stageOperator,
          stageValue: '{ "field": "value" }',
          withP2Experiment: true,
        });
        expect(
          screen.queryByTestId('server-error-banner-debug-button'),
          `expected no debug button for ${stageOperator}`
        ).to.not.exist;
      }
    });

    it('does not show the Debug button when AI features are disabled', async function () {
      await renderBanner(
        {
          stageOperator: '$search',
          stageValue: '{ "index": "default" }',
          withP2Experiment: true,
        },
        { enableGenAIFeatures: false }
      );
      expect(screen.queryByTestId('server-error-banner-debug-button')).to.not
        .exist;
    });

    it('calls tellMoreAboutInsight with stage context when Debug is clicked', async function () {
      const tellMoreAboutInsight = sinon.stub();
      const stageOperator = '$search';
      const stageValue = '{ "index": "default" }';

      await renderBanner({
        tellMoreAboutInsight,
        stageOperator,
        stageValue,
        withP2Experiment: true,
      });
      userEvent.click(screen.getByTestId('server-error-banner-debug-button'));

      expect(tellMoreAboutInsight).to.have.been.calledOnceWith({
        id: 'aggregation-pipeline-error',
        stageOperator,
        errorMessage: ERROR_MESSAGE,
        stageValue,
      });
    });
  });

  describe('error message', function () {
    it('renders the error message', async function () {
      await renderBanner();
      expect(screen.getByTestId('test-banner').textContent).to.include(
        ERROR_MESSAGE
      );
    });
  });
});
