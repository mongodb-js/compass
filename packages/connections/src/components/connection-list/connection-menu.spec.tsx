import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import ConnectionMenu from './connection-menu';
import { ConnectionInfo } from 'mongodb-data-service';

describe('ConnectionMenu Component', function () {
  describe('on non-favorite item', function () {
    beforeEach(function () {
      const connectionInfo: ConnectionInfo = {
        id: 'test-id',
        connectionOptions: {
          connectionString: 'mongodb://kaleesi',
        },
      };
      render(
        <ConnectionMenu
          connectionString={'mongodb://kaleesi'}
          duplicateConnection={() => true}
          removeConnection={() => true}
          connectionInfo={connectionInfo}
          iconColor="#EAEAEA"
        />
      );
    });

    it('shows a button', function () {
      expect(screen.getByRole('button')).to.be.visible;
    });

    it('does not show the menu items', function () {
      expect(screen.queryByText('Copy Connection String')).to.not.exist;
      expect(screen.queryByText('Duplicate')).to.not.exist;
      expect(screen.queryByText('Remove')).to.not.exist;
    });

    describe('when clicked', function () {
      beforeEach(function () {
        const button = screen.getByRole('button');

        fireEvent(
          button,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
      });

      it('shows the menu items without the "Duplicate" option', function () {
        expect(screen.getByText('Copy Connection String')).to.be.visible;
        expect(screen.queryByText('Duplicate')).to.throw;
        expect(screen.getByText('Remove')).to.be.visible;
      });
    });
  });
  describe('on favorite item', function () {
    beforeEach(function () {
      const connectionInfo: ConnectionInfo = {
        id: 'test-id',
        favorite: {
          name: 'First Server',
        },
        connectionOptions: {
          connectionString: 'mongodb://kaleesi',
        },
      };
      render(
        <ConnectionMenu
          connectionString={'mongodb://kaleesi'}
          duplicateConnection={() => true}
          removeConnection={() => true}
          connectionInfo={connectionInfo}
          iconColor="#EAEAEA"
        />
      );
    });

    it('shows a button', function () {
      expect(screen.getByRole('button')).to.be.visible;
    });

    it('does not show the menu items', function () {
      expect(screen.queryByText('Copy Connection String')).to.not.exist;
      expect(screen.queryByText('Duplicate')).to.not.exist;
      expect(screen.queryByText('Remove')).to.not.exist;
    });

    describe('when clicked', function () {
      beforeEach(function () {
        const button = screen.getByRole('button');

        fireEvent(
          button,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
      });

      it('shows the menu items', function () {
        expect(screen.getByText('Copy Connection String')).to.be.visible;
        expect(screen.getByText('Duplicate')).to.be.visible;
        expect(screen.getByText('Remove')).to.be.visible;
      });

      describe('when copy connection is clicked', function () {
        let mockCopyToClipboard;

        beforeEach(function () {
          const copyConnectionStringButton = screen.getByText(
            'Copy Connection String'
          );

          mockCopyToClipboard = sinon.fake.resolves(null);

          try {
            sinon.replace(global, 'navigator', {
              clipboard: {
                writeText: mockCopyToClipboard,
              },
            } as any);
          } catch (e) {
            // Electron has the global navigator as a getter.
            sinon.replaceGetter(
              global,
              'navigator',
              () =>
                ({
                  clipboard: {
                    writeText: mockCopyToClipboard,
                  },
                } as any)
            );
          }

          expect(mockCopyToClipboard.called).to.equal(false);
          fireEvent(
            copyConnectionStringButton,
            new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
            })
          );
        });

        afterEach(function () {
          sinon.restore();
        });

        it('calls to copy the connection string to clipboard', function () {
          expect(mockCopyToClipboard.called).to.equal(true);
          expect(mockCopyToClipboard.firstCall.args[0]).to.equal(
            'mongodb://kaleesi'
          );
        });

        it('opens a toast with a success message', async function () {
          await waitFor(
            () => expect(screen.getByText('Success!')).to.be.visible
          );
          await waitFor(
            () => expect(screen.getByText('Copied to clipboard.')).to.be.visible
          );
        });

        describe('when the close button is clicked', function () {
          beforeEach(async function () {
            await waitFor(
              () =>
                expect(screen.getByText('Copied to clipboard.')).to.be.visible
            );

            const closeToastButton = screen.getByLabelText('X Icon');
            fireEvent(
              closeToastButton,
              new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
              })
            );
          });

          it('hides the toast', async function () {
            await waitFor(
              () =>
                expect(screen.queryByText('Copied to clipboard.')).to.not.exist
            );
          });
        });
      });

      describe('when copy to keyboard fails', function () {
        let mockCopyToClipboard;

        beforeEach(function () {
          const copyConnectionStringButton = screen.getByText(
            'Copy Connection String'
          );

          mockCopyToClipboard = sinon.fake.rejects(new Error('Test error'));

          try {
            sinon.replace(global, 'navigator', {
              clipboard: {
                writeText: mockCopyToClipboard,
              },
            } as any);
          } catch (e) {
            // Electron has the global navigator as a getter.
            sinon.replaceGetter(
              global,
              'navigator',
              () =>
                ({
                  clipboard: {
                    writeText: mockCopyToClipboard,
                  },
                } as any)
            );
          }

          fireEvent(
            copyConnectionStringButton,
            new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
            })
          );
        });

        afterEach(function () {
          sinon.restore();
        });

        it('opens a toast with an error message', async function () {
          await waitFor(() => expect(screen.getByText('Error')).to.be.visible);
          await waitFor(
            () => expect(screen.getByText('Test error')).to.be.visible
          );
        });
      });
    });
  });
  describe('function calls', function () {
    it('should call the removeConnection function', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'test-id',
        favorite: {
          name: 'First Server',
        },
        connectionOptions: {
          connectionString: 'mongodb://kaleesi',
        },
      };
      const mockDuplicateConnection = sinon.fake.resolves(null);
      const mockRemoveConnection = sinon.fake.resolves(null);
      render(
        <ConnectionMenu
          connectionString={'mongodb://kaleesi'}
          duplicateConnection={mockDuplicateConnection}
          removeConnection={mockRemoveConnection}
          connectionInfo={connectionInfo}
          iconColor="#EAEAEA"
        />
      );

      fireEvent(
        screen.getByRole('button'),
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
      const duplicateConnectionButton = screen.getByText('Duplicate');
      fireEvent(
        duplicateConnectionButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
      const removeConnectionButton = screen.getByText('Remove');
      fireEvent(
        removeConnectionButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
      expect(mockDuplicateConnection.called).to.equal(true);
      expect(mockRemoveConnection.called).to.equal(true);
    });
  });
});
