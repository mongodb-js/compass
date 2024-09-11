import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { DropIndexPlugin } from '../index';
import Sinon from 'sinon';
import { expect } from 'chai';

describe('DropIndexPlugin', function () {
  const sandbox = Sinon.createSandbox();
  const dataService = {
    dropIndex: sandbox.stub().resolves(),
  };
  const Plugin = DropIndexPlugin.withMockServices({
    dataService,
  });

  afterEach(function () {
    sandbox.resetHistory();
    cleanup();
  });

  it('should show success toast when index is successfully dropped', async function () {
    const { localAppRegistry } = render(<Plugin namespace="db.coll"></Plugin>);
    localAppRegistry.emit('open-drop-index-modal', 'index_1');
    await waitFor(() => {
      screen.getByText('Drop Index');
    });
    userEvent.type(screen.getByRole('textbox'), 'index_1');
    userEvent.click(screen.getByRole('button', { name: 'Drop' }));
    await waitFor(() => {
      screen.getByText('Index "index_1" dropped');
    });
    expect(dataService.dropIndex).to.have.been.calledOnceWith(
      'db.coll',
      'index_1'
    );
  });

  it('should show error toast when dropping index failed', async function () {
    dataService.dropIndex.rejects(new Error('Index was not dropped, whoops!'));
    const { localAppRegistry } = render(<Plugin namespace="db.coll"></Plugin>);
    localAppRegistry.emit('open-drop-index-modal', 'index_1');
    await waitFor(() => {
      screen.getByText('Drop Index');
    });
    userEvent.type(screen.getByRole('textbox'), 'index_1');
    userEvent.click(screen.getByRole('button', { name: 'Drop' }));
    await waitFor(() => {
      screen.getByText('Failed to drop index "index_1"');
    });
  });
});
