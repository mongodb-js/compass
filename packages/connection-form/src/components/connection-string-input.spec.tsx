import React, { type ComponentProps } from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';

import ConnectionStringInput, {
  hidePasswordInConnectionString,
} from './connection-string-input';

const renderConnectionStringInput = (
  props: Partial<ComponentProps<typeof ConnectionStringInput>> = {}
) => {
  render(
    <ConfirmationModalArea>
      <ConnectionStringInput
        protectConnectionStrings={false}
        connectionString=""
        enableEditingConnectionString={false}
        onSubmit={() => {}}
        setEnableEditingConnectionString={() => {}}
        updateConnectionFormField={() => {}}
        {...props}
      />
    </ConfirmationModalArea>
  );
};

describe('ConnectionStringInput Component', function () {
  let setEnableEditingConnectionStringSpy: sinon.SinonSpy;
  let updateConnectionFormFieldSpy: sinon.SinonSpy;
  let submitConnectionFormSpy: sinon.SinonSpy;

  beforeEach(function () {
    setEnableEditingConnectionStringSpy = sinon.spy();
    updateConnectionFormFieldSpy = sinon.spy();
    submitConnectionFormSpy = sinon.spy();
  });
  afterEach(cleanup);

  describe('#hidePasswordInConnectionString', function () {
    it('returns the connection string when it cannot be parsed', function () {
      const result = hidePasswordInConnectionString('pineapples');
      expect(result).to.equal('pineapples');
    });

    it('returns the connection string when there is no password', function () {
      const result = hidePasswordInConnectionString(
        'mongodb://localhost:27017'
      );
      expect(result).to.equal('mongodb://localhost:27017/');
    });

    it('returns the connection string with password hidden', function () {
      const result = hidePasswordInConnectionString(
        'mongodb://pineapples:melons@localhost:27017'
      );
      expect(result).to.equal('mongodb://pineapples:*****@localhost:27017/');
    });

    it('returns the connection string with password hidden srv', function () {
      const result = hidePasswordInConnectionString(
        'mongodb+srv://pineapples:melons@localhost'
      );
      expect(result).to.equal('mongodb+srv://pineapples:*****@localhost/');
    });

    it('returns a connection string with search params', function () {
      const result = hidePasswordInConnectionString(
        'mongodb+srv://test:pineapple@test.mongodb.net/test?authSource=admin&replicaSet=test&readPreference=primary&appname=MongoDB+Compass+Dev+Local&ssl=true'
      );
      expect(result).to.equal(
        'mongodb+srv://test:*****@test.mongodb.net/test?authSource=admin&replicaSet=test&readPreference=primary&appname=MongoDB+Compass+Dev+Local&ssl=true'
      );
    });
  });

  describe('with an empty connection string', function () {
    beforeEach(function () {
      renderConnectionStringInput({
        connectionString: '',
        onSubmit: submitConnectionFormSpy,
        enableEditingConnectionString: true,
        setEnableEditingConnectionString: setEnableEditingConnectionStringSpy,
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
    });

    it('should show the connection string in the text area', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.have.text('');
    });

    it('should show the connection string input not disabled', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.not.match('[disabled]');
    });

    describe('when an invalid connection string is inputted', function () {
      beforeEach(function () {
        // Focus the input.
        userEvent.tab();
        userEvent.tab();
        userEvent.tab();
        userEvent.keyboard('z');
      });

      it('should call updateConnectionFormField with the invalid connection string', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-connection-string',
          newConnectionStringValue: 'z',
        });
      });
    });

    describe('clicking on edit connection string toggle', function () {
      beforeEach(function () {
        const toggle = screen.getByRole('switch');
        toggle.click();
      });

      it('should call setEnableEditingConnectionString', function () {
        expect(setEnableEditingConnectionStringSpy.callCount).to.equal(1);
        expect(setEnableEditingConnectionStringSpy.firstCall.args[0]).to.equal(
          false
        );
      });
    });

    describe('when a connection string is inputted', function () {
      beforeEach(function () {
        const input = screen.getByRole('textbox', {
          name: /uri/i,
        });
        fireEvent.focus(input);
        userEvent.type(input, 'mongodb://localhost');
      });

      it('should call updateConnectionFormField with the connection string', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(19);
        expect(updateConnectionFormFieldSpy.lastCall.args[0]).to.deep.equal({
          type: 'update-connection-string',
          newConnectionStringValue: 'mongodb://localhost',
        });
      });

      describe('when then enter key is inputted', function () {
        beforeEach(function () {
          expect(submitConnectionFormSpy.callCount).to.equal(0);

          userEvent.keyboard('{enter}');
        });

        it('should call to submitConnectionForm', function () {
          expect(submitConnectionFormSpy.callCount).to.equal(1);
        });
      });
    });
  });

  describe('the info button', function () {
    beforeEach(function () {
      renderConnectionStringInput({
        connectionString: 'mongodb+srv://turtles:pineapples@localhost/',
        enableEditingConnectionString: true,
        setEnableEditingConnectionString: setEnableEditingConnectionStringSpy,
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
    });

    it('has a link to docs', function () {
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).to.equal(
        'https://docs.mongodb.com/manual/reference/connection-string/'
      );
    });

    it('has a link role', function () {
      const button = screen.getByRole('link');
      expect(button.getAttribute('href')).to.equal(
        'https://docs.mongodb.com/manual/reference/connection-string/'
      );
    });
  });

  describe('with a connection string with a password and editing disabled', function () {
    beforeEach(function () {
      renderConnectionStringInput({
        connectionString: 'mongodb+srv://turtles:pineapples@localhost/',
        enableEditingConnectionString: false,
        setEnableEditingConnectionString: setEnableEditingConnectionStringSpy,
        updateConnectionFormField: updateConnectionFormFieldSpy,
      });
    });

    it('shows the connection string in the text area', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.have.text('mongodb+srv://turtles:*****@localhost/');
    });

    it('should show the connection string input disabled', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.match('[disabled]');
    });

    describe('clicking confirm to edit', function () {
      beforeEach(async function () {
        screen.getByRole('switch').click();

        // Click confirm on the modal that opens.
        const confirmButton = screen.getByText('Confirm').closest('button');
        fireEvent(
          confirmButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );

        // Wait for the modal to close.
        await waitFor(() => expect(screen.queryByText('Confirm')).to.not.exist);
      });

      it('should call setEnableEditingConnectionString', function () {
        expect(setEnableEditingConnectionStringSpy.callCount).to.equal(1);
        expect(setEnableEditingConnectionStringSpy.firstCall.args[0]).to.equal(
          true
        );
      });
    });

    describe('clicking cancel on confirmation to edit', function () {
      beforeEach(function () {
        screen.getByRole('switch').click();

        // Click cancel on the modal that opens.
        const cancelButton = screen.getByText('Cancel').closest('button');
        fireEvent(
          cancelButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
      });

      it('should not call setEnableEditingConnectionString', function () {
        expect(setEnableEditingConnectionStringSpy.callCount).to.equal(0);
      });
    });
  });

  it('hides password when editing is enabled and input is not focused', function () {
    const connectionString = 'mongodb+srv://turtles:pineapples@localhost/';
    renderConnectionStringInput({
      connectionString,
      enableEditingConnectionString: true,
      setEnableEditingConnectionString: setEnableEditingConnectionStringSpy,
    });

    const input = screen.getByRole('textbox', {
      name: /uri/i,
    });
    fireEvent.focus(input);
    expect(input.textContent, 'shows password when input is focused').to.equal(
      connectionString
    );

    fireEvent.focusOut(input);
    expect(
      input.textContent,
      'hides password when input is not focused'
    ).to.equal(connectionString.replace('pineapples', '*****'));

    expect(
      setEnableEditingConnectionStringSpy.getCalls(),
      'does not update connection string on focus change'
    ).to.have.lengthOf(0);
  });
});
