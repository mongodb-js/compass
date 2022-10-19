import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import HostInput from './host-input';

describe('HostInput', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('connection string srv schema (mongodb+srv://)', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@outerspace/?ssl=true'
      );
      render(
        <HostInput
          connectionStringUrl={connectionStringUrl}
          errors={[]}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('renders a host input', function () {
      expect(screen.getByRole('textbox')).to.exist;
    });

    it('renders the host value in the input', function () {
      expect(screen.getByRole('textbox').getAttribute('value')).to.equal(
        'outerspace'
      );
    });

    it('does not render a plus button to add more hosts', function () {
      expect(screen.queryByRole('button')).to.not.exist;
      expect(screen.queryByLabelText('Add')).to.not.exist;
    });

    describe('when the host is updated', function () {
      beforeEach(function () {
        userEvent.tab();
        userEvent.keyboard('s');
      });

      it('should call to update the hosts', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-host',
          fieldIndex: 0,
          newHostValue: 'outerspaces',
        });
      });
    });

    describe('when the host is updated to an invalid value', function () {
      beforeEach(function () {
        userEvent.tab();
        userEvent.keyboard('@');
      });

      it('should call to update the connection string url', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-host',
          fieldIndex: 0,
          newHostValue: 'outerspace@',
        });
      });
    });
  });

  describe('when the host has an error', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27099,outerspace:27098,localhost:27098/?ssl=true'
      );
      render(
        <HostInput
          connectionStringUrl={connectionStringUrl}
          errors={[
            {
              fieldName: 'hosts',
              fieldTab: 'general',
              fieldIndex: 1,
              message: 'Eeeee!!!',
            },
          ]}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('renders the error', function () {
      expect(screen.getByText('Eeeee!!!')).to.be.visible;
    });
  });

  describe('connection string standard schema (mongodb://)', function () {
    describe('with a single host', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@outerspace:27019/?ssl=true'
        );
        render(
          <HostInput
            connectionStringUrl={connectionStringUrl}
            errors={[]}
            updateConnectionFormField={updateConnectionFormFieldSpy}
          />
        );
      });

      it('does not render the remove host', function () {
        expect(screen.queryByLabelText('Remove')).to.not.exist;
      });

      describe('when the host is changed', function () {
        beforeEach(function () {
          const hostInput = screen.getByRole('textbox');
          userEvent.click(hostInput);
          userEvent.keyboard('7');
        });

        it('should call to update the connection string url with the updated host', function () {
          expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
          expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
            type: 'update-host',
            fieldIndex: 0,
            newHostValue: 'outerspace:270197',
          });
        });
      });
    });

    describe('with multiple hosts', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27098,outerspace:27099,localhost:27098/?ssl=true'
        );
        render(
          <HostInput
            connectionStringUrl={connectionStringUrl}
            errors={[]}
            updateConnectionFormField={updateConnectionFormFieldSpy}
          />
        );
      });

      it('renders inputs for all of the hosts', function () {
        expect(screen.getAllByRole('textbox').length).to.equal(4);
      });

      describe('when the remove host button is clicked', function () {
        beforeEach(function () {
          const removeHostButton = screen.getAllByLabelText('Remove')[2];
          fireEvent.click(removeHostButton);
        });

        it('should call to remove the host', function () {
          expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
          expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
            type: 'remove-host',
            fieldIndexToRemove: 2,
          });
        });
      });

      describe('when the add host button is clicked', function () {
        beforeEach(function () {
          const addHostButton = screen.getAllByLabelText('Add')[2];
          fireEvent.click(addHostButton);
        });

        it('should call to a new host at the location', function () {
          expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
          expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
            type: 'add-new-host',
            fieldIndexToAddAfter: 2,
          });
        });
      });

      describe('when a host is changed', function () {
        beforeEach(function () {
          const hostInput = screen.getAllByRole('textbox')[2];
          userEvent.click(hostInput);
          userEvent.keyboard('8');
        });

        it('should call to update the connection string url with the updated host', function () {
          expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
            type: 'update-host',
            fieldIndex: 2,
            newHostValue: 'outerspace:270998',
          });
        });
      });
    });
  });
});
