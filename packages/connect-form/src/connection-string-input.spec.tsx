import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import ConnectionStringInput, {
  hidePasswordInConnectionString,
} from './connection-string-input';

describe('ConnectionStringInput Component', function () {
  let openLinkSpy: sinon.SinonSpy;
  let setConnectionStringSpy: sinon.SinonSpy;

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
      openLinkSpy = sinon.spy();
      setConnectionStringSpy = sinon.spy();

      render(
        <ConnectionStringInput
          openLink={openLinkSpy}
          connectionString=""
          setConnectionString={setConnectionStringSpy}
        />
      );
    });

    afterEach(function () {
      openLinkSpy = null;
      setConnectionStringSpy = null;
    });

    it('should show the connection string in the text area', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.have.text('');
    });

    it('should show the connection string input not disabled', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.not.match('[disabled]');
    });
  });

  describe('when clicking the info button', function () {
    beforeEach(function () {
      openLinkSpy = sinon.spy();
      setConnectionStringSpy = sinon.spy();

      render(
        <ConnectionStringInput
          openLink={openLinkSpy}
          connectionString="mongodb+srv://turtles:pineapples@localhost/"
          setConnectionString={setConnectionStringSpy}
        />
      );

      expect(openLinkSpy.called).to.equal(false);

      const button = screen.getByTestId('connectionStringDocsButton');
      fireEvent(
        button,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    it('calls to open the docs link', function () {
      expect(openLinkSpy.called).to.equal(true);
      expect(openLinkSpy.firstCall.args[0]).to.equal(
        'https://docs.mongodb.com/manual/reference/connection-string/'
      );
    });
  });

  describe('with a connection string', function () {
    beforeEach(function () {
      openLinkSpy = sinon.spy();
      setConnectionStringSpy = sinon.spy();

      render(
        <ConnectionStringInput
          openLink={openLinkSpy}
          connectionString="mongodb+srv://turtles:pineapples@localhost/"
          setConnectionString={setConnectionStringSpy}
        />
      );
    });

    afterEach(function () {
      openLinkSpy = null;
      setConnectionStringSpy = null;
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
      beforeEach(function () {
        const button = screen.getByTestId('enableEditConnectionStringButton');
        fireEvent(
          button,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );

        // Click confirm on the modal that opens.
        const confirmButton = screen.getByText('Confirm').closest('button');
        fireEvent(
          confirmButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
      });

      it('should remove the disabled after clicking confirm to edit', function () {
        const textArea = screen.getByRole('textbox');
        expect(textArea).to.not.match('[disabled]');
      });

      it('should show the uncensored connection string', function () {
        const textArea = screen.getByRole('textbox');
        expect(textArea).to.have.text(
          'mongodb+srv://turtles:pineapples@localhost/'
        );
      });
    });

    describe('clicking cancel on confirmation to edit', function () {
      beforeEach(function () {
        const button = screen.getByTestId('enableEditConnectionStringButton');
        fireEvent(
          button,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );

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

      it('should keep the disabled on the textbox', function () {
        const textArea = screen.getByRole('textbox');
        expect(textArea).to.match('[disabled]');
      });

      it('should show the censored connection string', function () {
        const textArea = screen.getByRole('textbox');
        expect(textArea).to.have.text('mongodb+srv://turtles:*****@localhost/');
      });
    });
  });
});
