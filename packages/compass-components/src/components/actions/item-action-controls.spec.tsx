import React from 'react';
import {
  render,
  screen,
  cleanup,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import { ItemActionControls } from './item-action-controls';

describe('item action controls components', function () {
  afterEach(cleanup);
  describe('<ItemActionControls>', function () {
    it('renders nothing if num of actions === 0', function () {
      render(
        <ItemActionControls
          actions={[]}
          onAction={() => {}}
          data-testid="test-actions"
        ></ItemActionControls>
      );

      expect(screen.queryByTestId('test-actions')).to.not.exist;
    });

    it('renders buttons if num of actions < threeshold', function () {
      render(
        <ItemActionControls
          actions={[{ action: 'copy', label: 'Copy', icon: 'Copy' }]}
          onAction={() => {}}
          data-testid="test-actions"
        ></ItemActionControls>
      );

      expect(screen.getByTestId('test-actions')).to.exist;
      expect(screen.getByTestId('test-actions-copy-action')).to.exist;
      expect(screen.queryByLabelText(/show actions/i)).not.to.exist;
    });

    it('renders a menu if num of actions >= threeshold', function () {
      render(
        <ItemActionControls
          actions={[{ action: 'copy', label: 'Copy', icon: 'Copy' }]}
          onAction={() => {}}
          data-testid="test-actions"
          collapseToMenuThreshold={1}
        ></ItemActionControls>
      );

      const trigger = screen.getByTestId('test-actions-show-actions');
      expect(screen.queryByTestId('test-actions-copy-action')).not.to.exist;
      expect(screen.queryByLabelText(/show actions/i)).to.exist;
      userEvent.click(trigger);
      expect(screen.queryByTestId('test-actions-copy-action')).to.exist;
      expect(screen.getByText('Copy')).to.exist;
    });

    it('calls the action callback (buttons)', function () {
      const onAction = sinon.spy();
      render(
        <ItemActionControls
          actions={[
            { action: 'delete', label: 'Delete', icon: 'Trash' },
            { action: 'copy', label: 'Copy', icon: 'Copy' },
          ]}
          onAction={onAction}
          data-testid="test-actions"
          collapseToMenuThreshold={3}
        ></ItemActionControls>
      );

      expect(onAction).not.to.be.called;
      userEvent.click(screen.getByTestId('test-actions-copy-action'));
      expect(onAction).to.have.been.calledOnceWith('copy');
      userEvent.click(screen.getByTestId('test-actions-delete-action'));
      expect(onAction).to.have.been.calledWith('delete');
    });

    it('calls the action callback (menu)', function () {
      const onAction = sinon.spy();
      render(
        <ItemActionControls
          actions={[
            { action: 'delete', label: 'Delete', icon: 'Trash' },
            { action: 'copy', label: 'Copy', icon: 'Copy' },
          ]}
          onAction={onAction}
          data-testid="test-actions"
          collapseToMenuThreshold={1}
        ></ItemActionControls>
      );

      expect(onAction).not.to.be.called;
      userEvent.click(screen.getByTestId('test-actions-show-actions'));
      userEvent.click(screen.getByText('Copy'));
      expect(onAction).have.been.calledOnceWith('copy');
      userEvent.click(screen.getByText('Delete'));
      expect(onAction).have.been.calledWith('delete');
    });

    it('renders action icons when collapseAfter is provided', function () {
      render(
        <ItemActionControls
          actions={[
            { action: 'connect', label: 'Connection', icon: 'Plus' },
            { action: 'edit', label: 'Edit', icon: 'Edit' },
            { action: 'delete', label: 'Delete', icon: 'Trash' },
          ]}
          onAction={() => {}}
          data-testid="test-actions"
          collapseAfter={1}
        ></ItemActionControls>
      );

      expect(screen.queryByTestId('test-actions-connect-action')).to.exist;

      // Now open the menu and check this icon is not there
      userEvent.click(screen.getByTestId('test-actions-show-actions'));

      const menuActions = screen.getByRole('menu');
      expect(within(menuActions).queryByTestId('test-actions-connect-action'))
        .to.not.exist;

      expect(within(menuActions).queryByTestId('test-actions-edit-action')).to
        .exist;
      expect(within(menuActions).queryByTestId('test-actions-delete-action')).to
        .exist;
    });

    it('renders action icons disabled when collapseAfter is provided with disabled prop', function () {
      render(
        <ItemActionControls
          actions={[
            {
              action: 'connect',
              label: 'Connection',
              icon: 'Plus',
              isDisabled: true,
            },
            { action: 'edit', label: 'Edit', icon: 'Edit' },
            { action: 'delete', label: 'Delete', icon: 'Trash' },
          ]}
          onAction={() => {}}
          data-testid="test-actions"
          collapseAfter={1}
        ></ItemActionControls>
      );

      const actionButton = screen.getByTestId('test-actions-connect-action');
      expect(actionButton).to.exist;
      expect(actionButton).to.have.attribute('aria-disabled', 'true');
    });
  });
});
