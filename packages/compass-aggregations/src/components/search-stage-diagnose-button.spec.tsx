import React from 'react';
import {
  screen,
  renderWithActiveConnection,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { SearchStageDiagnoseButton } from './search-stage-diagnose-button';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

const CONNECTION: ConnectionInfo = {
  id: 'test',
  connectionOptions: { connectionString: 'mongodb://localhost:27017' },
};

function renderButton(
  props: Partial<React.ComponentProps<typeof SearchStageDiagnoseButton>> = {}
) {
  return renderWithActiveConnection(
    <SearchStageDiagnoseButton
      onClick={() => {}}
      data-testid="diagnose-button"
      {...props}
    />,
    CONNECTION
  );
}

describe('SearchStageDiagnoseButton', function () {
  it('renders the button', async function () {
    await renderButton();
    expect(screen.getByTestId('diagnose-button')).to.exist;
  });

  it('calls onClick when clicked', async function () {
    const onClick = sinon.stub();
    await renderButton({ onClick });
    userEvent.click(screen.getByTestId('diagnose-button'));
    expect(onClick).to.have.been.calledOnce;
  });
});
