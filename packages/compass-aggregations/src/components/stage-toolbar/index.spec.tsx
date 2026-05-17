import React from 'react';
import { screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

import {
  renderWithStore,
  wrapWithExperimentProvider,
} from '../../../test/configure-store';
import { ReadOnlyPreferenceAccess } from 'compass-preferences-model/provider';
import { ExperimentTestGroups } from '@mongodb-js/compass-telemetry';
import StageToolbar from './';
import {
  changeStageCollapsed,
  changeStageDisabled,
} from '../../modules/pipeline-builder/stage-editor';

const renderStageToolbar = async (
  pipeline: any[] = [{ $match: { _id: 1 } }, { $limit: 10 }, { $out: 'out' }],
  preferences?: InstanceType<typeof ReadOnlyPreferenceAccess>,
  {
    enableSearchActivationExperiment = false,
    services = {} as Parameters<typeof renderWithStore>[3],
    stageIndex = 0,
  }: {
    enableSearchActivationExperiment?: boolean;
    services?: Parameters<typeof renderWithStore>[3];
    stageIndex?: number;
  } = {}
) => {
  let ui = <StageToolbar index={stageIndex} />;
  if (enableSearchActivationExperiment) {
    ui = wrapWithExperimentProvider(
      ui,
      ExperimentTestGroups.searchActivationProgramP1Variant
    );
  }
  const result = await renderWithStore(ui, { pipeline }, undefined, {
    ...services,
    ...(preferences ? { preferences } : {}),
  });
  return result.plugin.store;
};

describe('StageToolbar', function () {
  it('renders collapse button', async function () {
    await renderStageToolbar();
    expect(screen.getByLabelText('Collapse')).to.exist;
  });
  it('renders stage number text', async function () {
    await renderStageToolbar();
    expect(screen.getByText('Stage 1')).to.exist;
  });
  it('render stage operator select', async function () {
    await renderStageToolbar();
    expect(screen.getByTestId('stage-operator-combobox')).to.exist;
  });
  it('renders stage enable/disable toggle', async function () {
    await renderStageToolbar();
    expect(screen.getByLabelText('Exclude stage from pipeline')).to.exist;
  });
  context('renders stage text', function () {
    it('when stage is disabled', async function () {
      const store = await renderStageToolbar();
      store.dispatch(changeStageDisabled(0, true));
      expect(
        screen.getByText('Stage disabled. Results not passed in the pipeline.')
      ).to.exist;
    });
    it('when stage is collapsed', async function () {
      const store = await renderStageToolbar();
      store.dispatch(changeStageCollapsed(0, true));
      expect(
        screen.getByText(
          'A sample of the aggregated results from this stage will be shown below.'
        )
      ).to.exist;
    });
  });
  it('renders option menu', async function () {
    await renderStageToolbar();
    expect(screen.getByTestId('stage-option-menu-button')).to.exist;
  });
  context('View token usage link', function () {
    it('does not render when enableRerank is false', async function () {
      await renderStageToolbar([{ $rerank: {} }]);
      expect(
        screen.queryByTestId('stage-toolbar-view-token-usage-link')
      ).to.not.exist;
    });

    it('does not render when stage is not $rerank', async function () {
      const preferences = new ReadOnlyPreferenceAccess({
        enableRerank: true,
      });
      await renderStageToolbar([{ $match: { _id: 1 } }], preferences);
      expect(
        screen.queryByTestId('stage-toolbar-view-token-usage-link')
      ).to.not.exist;
    });

    it('renders when enableRerank is true and stage is $rerank', async function () {
      const preferences = new ReadOnlyPreferenceAccess({
        enableRerank: true,
      });
      await renderStageToolbar([{ $rerank: {} }], preferences);
      expect(
        screen.getByTestId('stage-toolbar-view-token-usage-link')
      ).to.exist;
      expect(screen.getByText('View token usage')).to.exist;
    });
  });

  context('View Indexes button', function () {
    it('does not render when experiment is not in variant', async function () {
      await renderStageToolbar([{ $search: { index: 'default' } }]);
      expect(
        screen.queryByTestId('stage-toolbar-view-indexes-button')
      ).to.not.exist;
    });
    it('does not render when stage is not a search stage', async function () {
      await renderStageToolbar([{ $match: { _id: 1 } }], undefined, {
        enableSearchActivationExperiment: true,
      });
      expect(
        screen.queryByTestId('stage-toolbar-view-indexes-button')
      ).to.not.exist;
    });
    it('renders when experiment is in variant and stage is $search', async function () {
      await renderStageToolbar([{ $search: { index: 'default' } }], undefined, {
        enableSearchActivationExperiment: true,
      });
      expect(screen.getByTestId('stage-toolbar-view-indexes-button')).to.exist;
      expect(screen.getByText('View Indexes')).to.exist;
    });
    it('renders when experiment is in variant and stage is $searchMeta', async function () {
      await renderStageToolbar(
        [{ $searchMeta: { index: 'default' } }],
        undefined,
        {
          enableSearchActivationExperiment: true,
        }
      );
      expect(screen.getByTestId('stage-toolbar-view-indexes-button')).to.exist;
      expect(screen.getByText('View Indexes')).to.exist;
    });
    it('renders when experiment is in variant and stage is $vectorSearch', async function () {
      await renderStageToolbar(
        [{ $vectorSearch: { index: 'default' } }],
        undefined,
        {
          enableSearchActivationExperiment: true,
        }
      );
      expect(screen.getByTestId('stage-toolbar-view-indexes-button')).to.exist;
      expect(screen.getByText('View Indexes')).to.exist;
    });
  });

  context('rerank insight signal', function () {
    it('shows insight badge when $rerank is the first stage and enableRerank is true', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({ enableRerank: true });
      await renderStageToolbar([{ $rerank: {} }], undefined, {
        services: { preferences },
      });
      expect(screen.getByTestId('insight-badge-button')).to.exist;
    });

    it('does not show insight badge when $rerank is not the first stage', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({ enableRerank: true });
      await renderStageToolbar([{ $search: {} }, { $rerank: {} }], undefined, {
        services: { preferences },
        stageIndex: 1,
      });
      expect(screen.queryByTestId('insight-badge-button')).to.not.exist;
    });
  });
});
