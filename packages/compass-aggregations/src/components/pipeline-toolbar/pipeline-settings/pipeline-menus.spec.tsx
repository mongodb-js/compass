import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import { SaveMenuComponent, CreateMenuComponent } from './pipeline-menus';

describe('PipelineMenus', function () {
  describe('SaveMenu', function () {
    let onSaveSpy: SinonSpy;
    let onSaveAsSpy: SinonSpy;
    let onCreateViewSpy: SinonSpy;
    let menu: HTMLElement;
    beforeEach(function () {
      onSaveSpy = spy();
      onSaveAsSpy = spy();
      onCreateViewSpy = spy();
      render(
        <SaveMenuComponent
          isCreateViewAvailable={true}
          pipelineName={'Name'}
          onSave={onSaveSpy}
          onSaveAs={onSaveAsSpy}
          onCreateView={onCreateViewSpy}
        />
      );
      menu = screen.getByTestId('save-menu-show-actions');
      expect(menu).to.exist;
    });
    it('renders menu with options', function () {
      userEvent.click(menu);
      expect(screen.getByTestId('save-menu-save-action')).to.exist;
      expect(screen.getByTestId('save-menu-saveAs-action')).to.exist;
      expect(screen.getByTestId('save-menu-createView-action')).to.exist;
    });

    it('calls save', function () {
      userEvent.click(menu);

      userEvent.click(screen.getByTestId('save-menu-save-action'));
      expect(onSaveSpy.calledOnce).to.be.true;
      expect(onSaveSpy.firstCall.args).to.deep.equal(['Name']);
    });

    it('calls saveAs', function () {
      userEvent.click(menu);

      userEvent.click(screen.getByTestId('save-menu-saveAs-action'));
      expect(onSaveAsSpy.calledOnce).to.be.true;
      expect(onSaveAsSpy.firstCall.args).to.deep.equal(['Name']);
    });

    it('calls createView', function () {
      userEvent.click(menu);

      userEvent.click(screen.getByTestId('save-menu-createView-action'));
      expect(onCreateViewSpy.calledOnce).to.be.true;
      expect(onCreateViewSpy.firstCall.args).to.be.empty;
    });
  });

  describe('SaveMenu - createView disabled', function () {
    it('does not render createView menu option', function () {
      render(
        <SaveMenuComponent
          isCreateViewAvailable={false}
          pipelineName={'Name'}
          onSave={spy()}
          onSaveAs={spy()}
          onCreateView={spy()}
        />
      );
      const menu = screen.getByTestId('save-menu-show-actions');

      userEvent.click(menu);
      expect(screen.getByTestId('save-menu-save-action')).to.exist;
      expect(screen.getByTestId('save-menu-saveAs-action')).to.exist;
      expect(() => {
        screen.getByTestId('save-menu-createView-action');
      }).to.throw;
    });
  });

  describe('CreateMenu', function () {
    let onCreatePipelineSpy: SinonSpy;
    let onCreatePipelineFromTextSpy: SinonSpy;
    let menu: HTMLElement;
    beforeEach(function () {
      onCreatePipelineSpy = spy();
      onCreatePipelineFromTextSpy = spy();
      render(
        <CreateMenuComponent
          onCreatePipeline={onCreatePipelineSpy}
          onCreatePipelineFromText={onCreatePipelineFromTextSpy}
        />
      );
      menu = screen.getByTestId('create-new-menu-show-actions');
      expect(menu).to.exist;
    });
    it('renders menu with options', function () {
      userEvent.click(menu);

      expect(screen.getByTestId('create-new-menu-createPipeline-action')).to
        .exist;
      expect(
        screen.getByTestId('create-new-menu-createPipelineFromText-action')
      ).to.exist;
    });

    it('calls createPipeline', function () {
      userEvent.click(menu);

      userEvent.click(
        screen.getByTestId('create-new-menu-createPipeline-action')
      );
      expect(onCreatePipelineSpy.calledOnce).to.be.true;
      expect(onCreatePipelineSpy.firstCall.args).to.be.empty;
    });

    it('calls createPipelineFromText', function () {
      userEvent.click(menu);

      userEvent.click(
        screen.getByTestId('create-new-menu-createPipelineFromText-action')
      );
      expect(onCreatePipelineFromTextSpy.calledOnce).to.be.true;
      expect(onCreatePipelineFromTextSpy.firstCall.args).to.be.empty;
    });
  });
});
