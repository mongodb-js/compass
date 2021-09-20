import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { ResizeHandleVertical, ResizeHandleHorizontal } from './resize-handle';

describe('ResizeHandle Component', function () {
  describe('ResizeHandleVertical Component', function () {
    let onMoveLeftSpy: sinon.SinonSpy;
    let onMoveRightSpy: sinon.SinonSpy;

    beforeEach(function () {
      onMoveLeftSpy = sinon.spy();
      onMoveRightSpy = sinon.spy();
      render(
        <div>
          <ResizeHandleVertical
            onMoveLeftPressed={onMoveLeftSpy}
            onMoveRightPressed={onMoveRightSpy}
          />
        </div>
      );
    });

    describe('when the left arrow is pressed', function () {
      beforeEach(function () {
        const actionableElement = screen.getByRole('separator');
        const keyOptions = {
          key: 'ArrowLeft',
          code: 'ArrowLeft',
          keyCode: 37,
          charCode: 37,
        };
        fireEvent.keyDown(actionableElement, keyOptions);
      });

      it('should call the left arrow pressed function', function () {
        expect(onMoveLeftSpy).to.have.been.called;
      });

      it('should not have called the right arrow pressed function', function () {
        expect(onMoveRightSpy).to.not.have.been.called;
      });
    });

    describe('when the right arrow is pressed', function () {
      beforeEach(function () {
        const actionableElement = screen.getByRole('separator');
        const keyOptions = {
          key: 'ArrowRight',
          code: 'ArrowRight',
          keyCode: 39,
          charCode: 39,
        };
        fireEvent.keyDown(actionableElement, keyOptions);
      });

      it('should call the right arrow pressed function', function () {
        expect(onMoveRightSpy).to.have.been.called;
      });

      it('should not have called the left arrow pressed function', function () {
        expect(onMoveLeftSpy).to.not.have.been.called;
      });
    });
  });

  describe('ResizeHandleHorizontal Component', function () {
    let onMoveDownSpy: sinon.SinonSpy;
    let onMoveUpSpy: sinon.SinonSpy;

    beforeEach(function () {
      onMoveDownSpy = sinon.spy();
      onMoveUpSpy = sinon.spy();
      render(
        <div>
          <ResizeHandleHorizontal
            onMoveDownPressed={onMoveDownSpy}
            onMoveUpPressed={onMoveUpSpy}
          />
        </div>
      );
    });

    describe('when the down arrow is pressed', function () {
      beforeEach(function () {
        const actionableElement = screen.getByRole('separator');
        const keyOptions = {
          key: 'ArrowDown',
          code: 'ArrowDown',
          keyCode: 40,
          charCode: 40,
        };
        fireEvent.keyDown(actionableElement, keyOptions);
      });

      it('should call the down arrow pressed function', function () {
        expect(onMoveDownSpy).to.have.been.called;
      });

      it('should not have called the up arrow pressed function', function () {
        expect(onMoveUpSpy).to.not.have.been.called;
      });
    });

    describe('when the up arrow is pressed', function () {
      beforeEach(function () {
        const actionableElement = screen.getByRole('separator');
        const keyOptions = {
          key: 'ArrowUp',
          code: 'ArrowUp',
          keyCode: 38,
          charCode: 38,
        };
        fireEvent.keyDown(actionableElement, keyOptions);
      });

      it('should call the up arrow pressed function', function () {
        expect(onMoveUpSpy).to.have.been.called;
      });

      it('should not have called the down arrow pressed function', function () {
        expect(onMoveDownSpy).to.not.have.been.called;
      });
    });
  });
});
