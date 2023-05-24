import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import type { SinonSandbox } from 'sinon';
import { spy, createSandbox } from 'sinon';
import * as guideCueHook from '../../use-guide-cue';

import { PipelineExtraSettings } from './pipeline-extra-settings';
import preferences from 'compass-preferences-model';
import sinon from 'sinon';

const renderPipelineExtraSettings = (
  props: Partial<ComponentProps<typeof PipelineExtraSettings>> = {}
) => {
  return render(
    <PipelineExtraSettings
      isAutoPreview={true}
      isPipelineModeDisabled={true}
      pipelineMode={'builder-ui'}
      isSidePanelOpen={false}
      onToggleAutoPreview={() => {}}
      onChangePipelineMode={() => {}}
      onToggleSettings={() => {}}
      onToggleSidePanel={() => {}}
      {...props}
    />
  );
};

describe('PipelineExtraSettings', function () {
  let sandbox: SinonSandbox;
  beforeEach(function () {
    sandbox = createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('calls onToggleAutoPreview when clicked', function () {
    const onToggleAutoPreviewSpy = spy();
    renderPipelineExtraSettings({
      onToggleAutoPreview: onToggleAutoPreviewSpy,
    });
    const container = screen.getByTestId('pipeline-toolbar-extra-settings');
    const toggle = within(container).getByTestId(
      'pipeline-toolbar-preview-toggle'
    );
    expect(toggle).to.exist;
    userEvent.click(toggle);
    expect(onToggleAutoPreviewSpy.calledOnce).to.be.true;
  });

  it('calls onToggleSettings when clicked', function () {
    const onToggleSettingsSpy = spy();
    renderPipelineExtraSettings({ onToggleSettings: onToggleSettingsSpy });
    const container = screen.getByTestId('pipeline-toolbar-extra-settings');
    const button = within(container).getByTestId(
      'pipeline-toolbar-settings-button'
    );
    expect(button).to.exist;
    userEvent.click(button);
    expect(onToggleSettingsSpy.calledOnce).to.be.true;
  });

  it('shows pipeline builder toggle', function () {
    renderPipelineExtraSettings();
    const container = screen.getByTestId('pipeline-toolbar-extra-settings');
    expect(within(container).getByTestId('pipeline-builder-toggle')).to.exist;
  });

  describe('stage wizard', function () {
    let sandbox: sinon.SinonSandbox;
    beforeEach(function () {
      sandbox = sinon.createSandbox();
      sandbox
        .stub(preferences, 'getPreferences')
        .returns({ enableStageWizard: true } as any);
    });
    afterEach(function () {
      sandbox.restore();
    });

    it('calls onToggleSidePanel when clicked', function () {
      const onToggleSidePanelSpy = spy();
      renderPipelineExtraSettings({ onToggleSidePanel: onToggleSidePanelSpy });
      const container = screen.getByTestId('pipeline-toolbar-extra-settings');
      const button = within(container).getByTestId(
        'pipeline-toolbar-side-panel-button'
      );
      expect(button).to.exist;
      expect(onToggleSidePanelSpy.calledOnce).to.be.false;
      userEvent.click(button);
      expect(onToggleSidePanelSpy.calledOnce).to.be.true;
    });

    it('disables toggle side panel button in text mode', function () {
      renderPipelineExtraSettings({
        pipelineMode: 'as-text',
      });
      expect(
        screen
          .getByTestId('pipeline-toolbar-side-panel-button')
          .getAttribute('aria-disabled')
      ).to.equal('true');
    });

    context('guide cue', function () {
      const guideCueSandbox: sinon.SinonSandbox = sinon.createSandbox();

      afterEach(function () {
        guideCueSandbox.restore();
      });

      context('shows guide cue', function () {
        let markCueVisitedSpy: sinon.SinonSpy;
        beforeEach(function () {
          markCueVisitedSpy = sinon.spy();
          guideCueSandbox.stub(guideCueHook, 'useGuideCue').returns({
            isCueVisible: true,
            markCueVisited: markCueVisitedSpy,
          } as any);
          renderPipelineExtraSettings({
            pipelineMode: 'builder-ui',
          });
        });
        it('shows guide cue first time', function () {
          expect(screen.getByTestId('stage-wizard-guide-cue')).to.exist;
        });
        it('marks cue visited when stage wizard button is clicked', function () {
          expect(markCueVisitedSpy.callCount).to.equal(0);
          screen.getByTestId('pipeline-toolbar-side-panel-button').click();
          expect(markCueVisitedSpy.callCount).to.equal(1);
        });
      });

      context('does not show guide cue', function () {
        it('when its already shown', function () {
          guideCueSandbox
            .stub(guideCueHook, 'useGuideCue')
            .returns({ isCueVisible: false } as any);
          renderPipelineExtraSettings({
            pipelineMode: 'builder-ui',
          });
          expect(() => screen.getByTestId('stage-wizard-guide-cue')).to.throw;
        });

        it('in text mode', function () {
          guideCueSandbox
            .stub(guideCueHook, 'useGuideCue')
            .returns({ isCueVisible: true } as any);
          renderPipelineExtraSettings({
            pipelineMode: 'as-text',
          });
          expect(() => screen.getByTestId('stage-wizard-guide-cue')).to.throw;
        });
      });
    });
  });
});
