import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import Connection from './connection';

describe('Connection Component', function () {
  let onClickSpy: sinon.SinonSpy<any[], any>;
  let onDoubleClickSpy: sinon.SinonSpy<any[], any>;
  let duplicateConnectionSpy: sinon.SinonSpy<any[], any>;
  let removeConnectionSpy: sinon.SinonSpy<any[], any>;

  beforeEach(function () {
    onClickSpy = sinon.spy();
    onDoubleClickSpy = sinon.spy();
    duplicateConnectionSpy = sinon.spy();
    removeConnectionSpy = sinon.spy();
  });

  describe('when it has a lastUsed date', function () {
    it('shows the date as a string', function () {
      const lastUsed = new Date('Dec 17, 1995, 12:00 AM');
      const stub = sinon.stub(lastUsed, 'toLocaleString').returns('Dec, 17');

      render(
        <Connection
          isActive={false}
          connectionInfo={{
            id: '0000-0000-0000-0000',
            lastUsed: lastUsed,
            connectionOptions: {
              connectionString: '',
            },
          }}
          onClick={onClickSpy}
          onDoubleClick={onDoubleClickSpy}
          duplicateConnection={duplicateConnectionSpy}
          removeConnection={removeConnectionSpy}
        />
      );

      const dateStringElement = screen.getByText('Dec, 17');
      expect(dateStringElement).to.not.equal(null);
      expect(stub.getCall(0).args).to.deep.equal([
        'default',
        {
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          month: 'short',
          year: 'numeric',
        },
      ]);
    });
  });

  describe('when it is a favorite', function () {
    describe('when it has a name', function () {
      beforeEach(function () {
        render(
          <Connection
            isActive={false}
            connectionInfo={{
              id: '0000-0000-0000-0000',
              connectionOptions: {
                connectionString: '',
              },
              favorite: {
                name: 'aaa',
              },
            }}
            onClick={onClickSpy}
            onDoubleClick={onDoubleClickSpy}
            duplicateConnection={duplicateConnectionSpy}
            removeConnection={removeConnectionSpy}
          />
        );
      });

      it('shows the name', function () {
        const connectionTitle = screen.getByRole('heading');
        expect(connectionTitle.textContent).to.equal('aaa');
      });
    });

    describe('when there is not a favorite color', function () {
      beforeEach(function () {
        render(
          <Connection
            isActive={false}
            connectionInfo={{
              id: '0000-0000-0000-0000',
              connectionOptions: {
                connectionString: '',
              },
              favorite: {
                name: 'aaa',
              },
            }}
            onClick={onClickSpy}
            onDoubleClick={onDoubleClickSpy}
            duplicateConnection={duplicateConnectionSpy}
            removeConnection={removeConnectionSpy}
          />
        );
      });

      it('it uses 33, 49, 60 by default', function () {
        const favoriteIndicator = screen.getByTestId('connection-icon');
        expect(
          getComputedStyle(favoriteIndicator).getPropertyValue('color')
        ).to.equal('rgb(28, 45, 56)');
      });
    });
  });

  describe('when it is not a favorite', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connectionInfo={{
            id: '0000-0000-0000-0000',
            connectionOptions: {
              connectionString: 'mongodb://outerspace:27019',
            },
          }}
          onClick={onClickSpy}
          onDoubleClick={onDoubleClickSpy}
          duplicateConnection={duplicateConnectionSpy}
          removeConnection={removeConnectionSpy}
        />
      );
    });

    it('there is an icon and its 33, 49, 60', function () {
      const favoriteIndicator = screen.queryByTestId('connection-icon');
      expect(favoriteIndicator).to.not.equal(null);
      expect(
        getComputedStyle(favoriteIndicator).getPropertyValue('color')
      ).to.equal('rgb(28, 45, 56)');
    });

    it('it shows the connection title as the name', function () {
      const connectionTitle = screen.getByRole('heading');
      expect(connectionTitle.textContent).to.equal('outerspace:27019');
    });

    it('the connection title has a title', function () {
      const connectionTitle = screen.getByRole('heading');
      expect(connectionTitle.title).to.equal('outerspace:27019');
    });
  });

  describe('when it is not a favorite and has an invalid connection string to get a title from', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connectionInfo={{
            id: '0000-0000-0000-0000',
            connectionOptions: {
              connectionString: 'invalid connection string',
            },
          }}
          onClick={onClickSpy}
          onDoubleClick={onDoubleClickSpy}
          duplicateConnection={duplicateConnectionSpy}
          removeConnection={removeConnectionSpy}
        />
      );
    });

    it('it shows a connection string title', function () {
      const connectionTitle = screen.getByRole('heading');
      expect(connectionTitle.textContent).to.equal('invalid connection string');
    });
  });

  describe('when it has no connection string or favorite name', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connectionInfo={{
            id: '0000-0000-0000-0000',
            connectionOptions: {
              connectionString: '',
            },
          }}
          onClick={onClickSpy}
          onDoubleClick={onDoubleClickSpy}
          duplicateConnection={duplicateConnectionSpy}
          removeConnection={removeConnectionSpy}
        />
      );
    });

    it('it shows a default connection title', function () {
      const connectionTitle = screen.getByRole('heading');
      expect(connectionTitle.textContent).to.equal('Connection');
    });
  });

  describe('when clicked', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connectionInfo={{
            id: '0000-0000-0000-0000',
            connectionOptions: {
              connectionString: '',
            },
            favorite: {
              name: '123',
            },
          }}
          onClick={onClickSpy}
          onDoubleClick={onDoubleClickSpy}
          duplicateConnection={duplicateConnectionSpy}
          removeConnection={removeConnectionSpy}
        />
      );
      const button = screen.getByText('123').closest('button');

      expect(onClickSpy.called).to.equal(false);

      fireEvent(
        button,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    it('calls the onclick handler', function () {
      expect(onClickSpy.called).to.equal(true);
    });
  });

  describe('when double clicked', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connectionInfo={{
            id: '0000-0000-0000-0000',
            connectionOptions: {
              connectionString: 'double-click.com',
            },
            favorite: {
              name: 'double-click',
            },
          }}
          onClick={onClickSpy}
          onDoubleClick={onDoubleClickSpy}
          duplicateConnection={duplicateConnectionSpy}
          removeConnection={removeConnectionSpy}
        />
      );
      const button = screen.getByText('double-click').closest('button');
      expect(onDoubleClickSpy.called).to.equal(false);
      fireEvent(
        button,
        new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
        })
      );
    });

    it('calls the ondoubleclick handler', function () {
      expect(onDoubleClickSpy.called).to.equal(true);
      const [connectionInfo] = onDoubleClickSpy.getCall(0).args;
      expect(connectionInfo).to.deep.equal({
        id: '0000-0000-0000-0000',
        connectionOptions: {
          connectionString: 'double-click.com',
        },
        favorite: {
          name: 'double-click',
        },
      });
    });
  });
});
