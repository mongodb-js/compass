import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { ToolCallTitle } from './tool-call-title';

describe('ToolCallTitle', function () {
  function renderTitle(
    title: string = 'Ran list-databases',
    toolDisplayName: string = 'list-databases',
    toolDescription: string = ''
  ) {
    return render(
      <ToolCallTitle
        title={title}
        toolDisplayName={toolDisplayName}
        toolDescription={toolDescription}
      />
    );
  }

  it('renders the plain title when no description is provided', function () {
    const { container } = renderTitle();

    expect(container).to.have.text('Ran list-databases');
  });

  it('renders the plain title when the tool name is not part of the title', function () {
    const { container } = renderTitle(
      'Connect with Atlas to debug this connection?',
      'list-databases',
      'Lists all databases'
    );

    expect(container).to.have.text(
      'Connect with Atlas to debug this connection?'
    );
    expect(screen.queryByText('list-databases')).to.not.exist;
  });

  describe('when a description is provided and the name is in the title', function () {
    it('keeps the full title text intact and shows tooltip', async function () {
      const { container } = renderTitle(
        'Run list-databases?',
        'list-databases',
        'Lists all databases'
      );

      expect(container).to.have.text('Run list-databases?');
      userEvent.hover(screen.getByText('list-databases'));

      await waitFor(() => {
        expect(screen.getByText('Lists all databases')).to.exist;
      });
    });
  });
});
