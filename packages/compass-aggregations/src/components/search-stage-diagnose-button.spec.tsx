import React from 'react';
import {
  screen,
  renderWithActiveConnection,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { SearchStageDiagnoseButton } from './search-stage-diagnose-button';
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

function renderButton(
  props: Partial<React.ComponentProps<typeof SearchStageDiagnoseButton>> = {},
  {
    withP2 = false,
    diagnoseSearchStage = sinon.stub(),
  }: { withP2?: boolean; diagnoseSearchStage?: sinon.SinonStub } = {},
  preferences: Record<string, unknown> = {}
) {
  const element = (
    <AssistantActionsContext.Provider value={{ diagnoseSearchStage }}>
      <SearchStageDiagnoseButton
        stageOperator="$search"
        stageValue={'{ "index": "default" }'}
        searchIndexName="default"
        context="Stage Preview"
        data-testid="diagnose-button"
        {...props}
      />
    </AssistantActionsContext.Provider>
  );

  return renderWithActiveConnection(
    withP2
      ? wrapWithExperimentProvider(
          element,
          ExperimentTestGroups.searchActivationProgramP2Variant
        )
      : element,
    CONNECTION,
    { preferences: { ...AI_PREFERENCES, ...preferences } }
  );
}

describe('SearchStageDiagnoseButton', function () {
  it('renders when the P2 experiment is active, the assistant is enabled, and the stage is $search', async function () {
    await renderButton({}, { withP2: true });
    expect(screen.getByTestId('diagnose-button')).to.exist;
  });

  it('does not render when not in the P2 experiment variant', async function () {
    await renderButton({}, { withP2: false });
    expect(screen.queryByTestId('diagnose-button')).to.not.exist;
  });

  it('does not render for non-$search stages', async function () {
    await renderButton({ stageOperator: '$vectorSearch' }, { withP2: true });
    expect(screen.queryByTestId('diagnose-button')).to.not.exist;
  });

  it('does not render when AI features are disabled', async function () {
    await renderButton({}, { withP2: true }, { enableGenAIFeatures: false });
    expect(screen.queryByTestId('diagnose-button')).to.not.exist;
  });

  it('calls diagnoseSearchStage with the stage context on click', async function () {
    const diagnoseSearchStage = sinon.stub();
    await renderButton(
      {
        stageOperator: '$search',
        stageValue: '{ "index": "movies" }',
        searchIndexName: 'movies',
      },
      { withP2: true, diagnoseSearchStage }
    );
    userEvent.click(screen.getByTestId('diagnose-button'));
    expect(diagnoseSearchStage).to.have.been.calledOnceWith({
      stageOperator: '$search',
      indexName: 'movies',
      stageValue: '{ "index": "movies" }',
    });
  });

  it('closes focus mode before diagnosing when onCloseFocusMode is provided', async function () {
    const onCloseFocusMode = sinon.stub();
    await renderButton({ onCloseFocusMode }, { withP2: true });
    userEvent.click(screen.getByTestId('diagnose-button'));
    expect(onCloseFocusMode).to.have.been.calledOnce;
  });
});
