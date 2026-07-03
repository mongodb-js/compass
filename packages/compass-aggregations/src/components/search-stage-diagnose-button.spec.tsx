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
    diagnoseSearchStage = sinon.stub(),
  }: { diagnoseSearchStage?: sinon.SinonStub } = {}
) {
  const element = (
    <AssistantActionsContext.Provider value={{ diagnoseSearchStage }}>
      <SearchStageDiagnoseButton
        stageOperator="$search"
        stageValue={'{ "index": "default" }'}
        searchIndexName="default"
        data-testid="diagnose-button"
        {...props}
      />
    </AssistantActionsContext.Provider>
  );

  return renderWithActiveConnection(element, CONNECTION, {
    preferences: AI_PREFERENCES,
  });
}

describe('SearchStageDiagnoseButton', function () {
  it('renders the button', async function () {
    await renderButton();
    expect(screen.getByTestId('diagnose-button')).to.exist;
  });

  it('calls diagnoseSearchStage with the stage context on click', async function () {
    const diagnoseSearchStage = sinon.stub();
    await renderButton(
      {
        stageOperator: '$search',
        stageValue: '{ "index": "movies" }',
        searchIndexName: 'movies',
      },
      { diagnoseSearchStage }
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
    await renderButton({ onCloseFocusMode });
    userEvent.click(screen.getByTestId('diagnose-button'));
    expect(onCloseFocusMode).to.have.been.calledOnce;
  });
});
