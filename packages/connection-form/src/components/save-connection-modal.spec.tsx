import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import SaveConnectionModal from './save-connection-modal';

describe('SaveConnectionModal Component', function () {
  let onSaveSpy: sinon.SinonSpy;
  let onCancelSpy;

  beforeEach(function () {
    onSaveSpy = sinon.spy();
    onCancelSpy = sinon.spy();
  });

  afterEach(function () {
    cleanup();
  });

  describe('when the loaded connection is not a favorite', function () {
    beforeEach(function () {
      render(
        <SaveConnectionModal
          onSaveClicked={onSaveSpy}
          onCancelClicked={onCancelSpy}
          open
          initialFavoriteInfo={undefined}
        />
      );
    });

    it('should have the title "Save connection to favorites"', function () {
      expect(screen.getByText('Save connection to favorites')).to.be.visible;
    });

    it('should have the no-color option already selected', function () {
      expect(screen.getByTestId('color-pick-no-color-selected')).to.be.visible;
    });

    describe('when the color and name are changed and save is clicked', function () {
      beforeEach(function () {
        fireEvent.click(screen.getByTestId('color-pick-color3'));

        const textArea = screen.getByRole('textbox');

        fireEvent.change(textArea, {
          target: { value: 'delicious cuban sandwich' },
        });
      });

      describe('when the cancel button is clicked', function () {
        beforeEach(function () {
          fireEvent.click(screen.getByText('Cancel'));
        });

        it('should not have called to save', function () {
          expect(onSaveSpy.callCount).to.equal(0);
        });

        it('should have called the cancel spy', function () {
          expect(onCancelSpy.callCount).to.equal(1);
        });
      });

      describe('when the save button is clicked', function () {
        beforeEach(function () {
          fireEvent.click(screen.getByText('Save'));
        });

        it('should have called to save with the new config', function () {
          expect(onSaveSpy.callCount).to.equal(1);
          expect(onSaveSpy.firstCall.args[0]).to.deep.equal({
            name: 'delicious cuban sandwich',
            color: 'color3',
          });
        });

        it('should not have called the cancel spy', function () {
          expect(onCancelSpy.callCount).to.equal(0);
        });
      });
    });
  });

  describe('when the connection does not have a name', function () {
    beforeEach(function () {
      render(
        <SaveConnectionModal
          onSaveClicked={onSaveSpy}
          onCancelClicked={onCancelSpy}
          open
          initialFavoriteInfo={{ color: 'color1', name: '' }}
        />
      );
    });

    it('renders save disabled', function () {
      const button = screen.getByText('Save').closest('button');
      expect(button.disabled).to.be.true;
    });
  });

  describe('when the connection does have a name', function () {
    beforeEach(function () {
      render(
        <SaveConnectionModal
          onSaveClicked={onSaveSpy}
          onCancelClicked={onCancelSpy}
          open
          initialFavoriteInfo={{ color: 'color1', name: 'some name' }}
        />
      );
    });

    it('renders save as enabled', function () {
      const button = screen.getByText('Save').closest('button');
      expect(button.disabled).not.to.be.true;
    });
  });

  describe('when the loaded connection is already a favorite', function () {
    beforeEach(function () {
      render(
        <SaveConnectionModal
          onSaveClicked={onSaveSpy}
          onCancelClicked={onCancelSpy}
          open
          initialFavoriteInfo={{
            name: 'pineapples',
            color: 'color3',
          }}
        />
      );
    });

    it('should have the title "Edit favorite"', function () {
      expect(screen.getByText('Edit favorite')).to.be.visible;
    });

    it('should have the color already selected', function () {
      expect(screen.queryByTestId('color-pick-no-color-selected')).to.not.exist;
      expect(screen.getByTestId('color-pick-color3-selected')).to.be.visible;
    });
  });

  describe('when saveText is passed', function () {
    beforeEach(function () {
      render(
        <SaveConnectionModal
          onSaveClicked={onSaveSpy}
          onCancelClicked={onCancelSpy}
          saveText="Save & Connect"
          open
        />
      );
    });

    it('should set the button text accordingly', function () {
      expect(screen.getByText('Save & Connect')).to.be.visible;
    });
  });
});
