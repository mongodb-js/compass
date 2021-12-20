import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import Connection from './connection';

describe('Connection Component', function () {
  let onClickSpy: sinon.SinonSpy<any[], any>;
  let onDoubleClickSpy: sinon.SinonSpy<any[], any>;

  beforeEach(function () {
    onClickSpy = sinon.spy();
    onDoubleClickSpy = sinon.spy();
  });

  describe('when it has a lastUsed date', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connectionInfo={{
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
      const dateTime = screen.getAllByTestId('recent-connection-description')[0].textContent;
      expect(dateTime).to.equal('17 Dec 1995, 00:00');
    });
  });

  describe('when it is a favorite', function () {
    describe('when it has a name', function () {
      beforeEach(function () {
        render(
          <Connection
            isActive={false}
            connectionInfo={{
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
            connectionInfo={{
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

      it('it uses white by default', function () {
        const favoriteIndicator = screen.getByTestId('connection-icon');
        expect(
          getComputedStyle(favoriteIndicator).getPropertyValue(
            'color'
          )
        ).to.equal('rgb(255, 255, 255)');
      });
    });

    describe('when there is a favorite color', function () {
      beforeEach(function () {
        render(
          <Connection
            isActive={false}
            connectionInfo={{
              connectionOptions: {
                connectionString: '',
              },
              favorite: {
                name: 'aaa',
                color: 'rgb(95, 200, 110)',
              },
            }}
            onClick={onClickSpy}
          />
        );
      });

      it('it uses favorite color', function () {
        const favoriteIndicator = screen.getByTestId('connection-icon');
        expect(
          getComputedStyle(favoriteIndicator).getPropertyValue(
            'color'
          )
        ).to.equal('rgb(95, 200, 110)');
      });
    });
  });

  describe('when it is not a favorite', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connectionInfo={{
            connectionOptions: {
              connectionString: 'mongodb://outerspace:27019',
            },
          }}
          onClick={onClickSpy}
        />
      );
    });

    it('there is an icon and its white', function () {
      const favoriteIndicator = screen.queryByTestId('connection-icon');
      expect(favoriteIndicator).to.not.equal(null);
      expect(
        getComputedStyle(favoriteIndicator).getPropertyValue(
          'color'
        )
      ).to.equal('rgb(255, 255, 255)');
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
            connectionOptions: {
              connectionString: 'invalid connection string',
            },
          }}
          onClick={onClickSpy}
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
            connectionOptions: {
              connectionString: '',
            },
          }}
          onClick={onClickSpy}
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

  describe('when double clicked', function () {
    beforeEach(function () {
      render(
        <Connection
          isActive={false}
          connectionInfo={{
            connectionOptions: {
              connectionString: 'double-click.com',
            },
            favorite: {
              name: 'double-click',
            },
          }}
          onDoubleClick={onDoubleClickSpy}
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
        connectionOptions: {
          connectionString: 'double-click.com',
        },
        favorite: {
          name: 'double-click',
        },
      });
    });
  });

  describe('when connection is active', function() {
    describe('and is favorite', function() {
      describe('and has a favorite color', function() {
        beforeEach(function () {
          render(
            <Connection
              isActive={true}
              connectionInfo={{
                id: '1234',
                connectionOptions: {
                  connectionString: '',
                },
                favorite: {
                  name: 'aaa',
                  color: 'rgb(95, 200, 110)',
                },
              }}
            />
          );
        });
        it('uses favorite color as background color and white as text color', function() {
          const connection = screen.getByTestId('saved-connection-button-1234');
          expect(connection).to.not.equal(null);
          const styles = getComputedStyle(connection);
          expect(
            styles.getPropertyValue(
              'color'
            )
          ).to.equal('rgb(255, 255, 255)');
          expect(
            styles.getPropertyValue(
              'background-color'
            )
          ).to.equal('rgb(95, 200, 110)');
        });
      });
      describe('and does not have a favorite color', function() {
        beforeEach(function () {
          render(
            <Connection
              isActive={true}
              connectionInfo={{
                id: '1234',
                connectionOptions: {
                  connectionString: '',
                },
                favorite: {
                  name: 'aaa',
                },
              }}
            />
          );
        });
        it('uses dark gray as background color and white as text color', function() {
          const connection = screen.getByTestId('saved-connection-button-1234');
          expect(connection).to.not.equal(null);
          const styles = getComputedStyle(connection);
          expect(
            styles.getPropertyValue(
              'color'
            )
          ).to.equal('rgb(255, 255, 255)');
          expect(
            styles.getPropertyValue(
              'background-color'
            )
          ).to.equal('rgb(61, 79, 88)');
        });
      });
    });
    describe('and is not favorite', function() {
      beforeEach(function () {
        render(
          <Connection
            isActive={true}
            connectionInfo={{
              id: '1234',
              connectionOptions: {
                connectionString: '',
              },
            }}
          />
        );
      });
      it('uses dark gray as background color and white as text color', function() {
        const connection = screen.getByTestId('saved-connection-button-1234');
        expect(connection).to.not.equal(null);
        const styles = getComputedStyle(connection);
        expect(
          styles.getPropertyValue(
            'color'
          )
        ).to.equal('rgb(255, 255, 255)');
        expect(
          styles.getPropertyValue(
            'background-color'
          )
        ).to.equal('rgb(61, 79, 88)');
      });
    });
  });
});
