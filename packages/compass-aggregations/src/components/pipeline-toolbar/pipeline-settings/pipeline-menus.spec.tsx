import React from 'react';
import { render, screen, within } from '@testing-library/react';
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
    });
    it('renders menu with options', function () {
      const menu = screen.getByTestId('save-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('save-menu-content');
      expect(within(menuContent).getByLabelText('Save')).to.exist;
      expect(within(menuContent).getByLabelText('Save as')).to.exist;
      expect(within(menuContent).getByLabelText('Create view')).to.exist;
    });

    it('calls save', function () {
      const menu = screen.getByTestId('save-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('save-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Save'));

      expect(onSaveSpy.calledOnce).to.be.true;
      expect(onSaveSpy.firstCall.args).to.deep.equal(['Name']);
    });

    it('calls saveAs', function () {
      const menu = screen.getByTestId('save-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('save-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Save as'));

      expect(onSaveAsSpy.calledOnce).to.be.true;
      expect(onSaveAsSpy.firstCall.args).to.deep.equal(['Name']);
    });

    it('calls createView', function () {
      const menu = screen.getByTestId('save-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('save-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Create view'));

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
      const menu = screen.getByTestId('save-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('save-menu-content');
      expect(within(menuContent).getByLabelText('Save')).to.exist;
      expect(within(menuContent).getByLabelText('Save as')).to.exist;
      expect(() => {
        within(menuContent).getByLabelText('Create view');
      }).to.throw;
    });
  });

  describe('CreateMenu', function () {
    let onCreatePipelineSpy: SinonSpy;
    let onCreatePipelineFromTextSpy: SinonSpy;
    beforeEach(function () {
      onCreatePipelineSpy = spy();
      onCreatePipelineFromTextSpy = spy();
      render(
        <CreateMenuComponent
          onCreatePipeline={onCreatePipelineSpy}
          onCreatePipelineFromText={onCreatePipelineFromTextSpy}
        />
      );
    });
    it('renders menu with options', function () {
      const menu = screen.getByTestId('create-new-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('create-new-menu-content');
      expect(within(menuContent).getByLabelText('Pipeline')).to.exist;
      expect(within(menuContent).getByLabelText('Pipeline from text')).to.exist;
    });

    it('calls createPipeline', function () {
      const menu = screen.getByTestId('create-new-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('create-new-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Pipeline'));

      expect(onCreatePipelineSpy.calledOnce).to.be.true;
      expect(onCreatePipelineSpy.firstCall.args).to.be.empty;
    });

    it('calls createPipleineFromText', function () {
      const menu = screen.getByTestId('create-new-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('create-new-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Pipeline from text'));

      expect(onCreatePipelineFromTextSpy.calledOnce).to.be.true;
      expect(onCreatePipelineFromTextSpy.firstCall.args).to.be.empty;
    });
  });
});
