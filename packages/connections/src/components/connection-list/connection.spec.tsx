import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import Connection from './connection';

describe('Connection Component', function () {
  let onClickSpy;

  beforeEach(function () {
    onClickSpy = sinon.spy();
  });

  describe('when it has a lastUsed date', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connection={{
            lastUsed: new Date('Dec 17, 1995, 12:00 AM'),
            connectionOptions: {
              connectionString: '',
            },
          }}
          onClick={onClickSpy}
        />
      );
    });

    it('shows the date as a string', function () {
      const dateStringElement = screen.getByText('Dec 17, 1995, 12:00 AM');
      expect(dateStringElement).to.not.equal(null);
    });
  });

  describe('when it is a favorite', function () {
    describe('when it has a name', function () {
      beforeEach(function () {
        render(
          <Connection
            isActive={false}
            connection={{
              connectionOptions: {
                connectionString: '',
              },
              favorite: {
                name: 'aaa',
              },
            }}
            onClick={onClickSpy}
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
            connection={{
              connectionOptions: {
                connectionString: '',
              },
              favorite: {
                name: 'aaa',
              },
            }}
            onClick={onClickSpy}
          />
        );
      });

      it('there is no favorite color', function () {
        const favoriteIndicator = screen.queryByTestId(
          'connection-favorite-indicator'
        );
        expect(favoriteIndicator).to.equal(null);
      });
    });

    describe('when there is a favorite color', function () {
      beforeEach(function () {
        render(
          <Connection
            isActive={false}
            connection={{
              connectionOptions: {
                connectionString: '',
              },
              favorite: {
                name: 'aaa',
                color: 'orange',
              },
            }}
            onClick={onClickSpy}
          />
        );
      });

      it('has a favorite indicator with the favorite color', function () {
        const favoriteIndicator = screen.getByTestId(
          'connection-favorite-indicator'
        );

        expect(
          getComputedStyle(favoriteIndicator).getPropertyValue(
            'background-color'
          )
        ).to.equal('orange');
      });
    });
  });

  describe('when it is not a favorite', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connection={{
            connectionOptions: {
              connectionString: 'mongodb://outerspace:27019',
            },
          }}
          onClick={onClickSpy}
        />
      );
    });

    it('there is no favorite name', function () {
      const favoriteIndicator = screen.queryByTestId(
        'connection-favorite-indicator'
      );
      expect(favoriteIndicator).to.equal(null);
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
          connection={{
            connectionOptions: {
              connectionString: 'invalid connection string',
            },
          }}
          onClick={onClickSpy}
        />
      );
    });

    it('it shows a default connection title', function () {
      const connectionTitle = screen.getByRole('heading');
      expect(connectionTitle.textContent).to.equal('Recent Connection');
    });
  });

  describe('when clicked', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connection={{
            connectionOptions: {
              connectionString: '',
            },
            favorite: {
              name: '123',
            },
          }}
          onClick={onClickSpy}
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
});
