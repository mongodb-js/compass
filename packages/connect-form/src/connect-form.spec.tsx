import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import ConnectForm from './connect-form';

function renderForm() {
  return render(
    <ConnectForm
      onConnectClicked={() => {
        /* */
      }}
      initialConnectionInfo={{
        connectionOptions: {
          connectionString: 'mongodb://pineapple:orangutans@localhost:27019',
        },
      }}
    />
  );
}

describe('ConnectForm Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should show the heading', function () {
    renderForm();
    expect(screen.getByRole('heading')).to.have.text('New Connection');
  });

  it('should show the connect button', function () {
    renderForm();
    const button = screen.getByText('Connect').closest('button');
    expect(button).to.not.match('disabled');
  });

  it('should render the connection string textbox', function () {
    renderForm();
    const textArea = screen.getByRole('textbox');
    expect(textArea).to.have.text('mongodb://pineapple:*****@localhost:27019/');
  });
});
