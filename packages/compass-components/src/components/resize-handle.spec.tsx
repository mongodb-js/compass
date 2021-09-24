import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { ResizeHandleVertical, ResizeHandleHorizontal } from './resize-handle';

describe('ResizeHandle Component', function () {
  describe('ResizeHandleVertical Component', function () {
    let onResizeSpy: sinon.SinonSpy;
    beforeEach(function () {
      onResizeSpy = sinon.spy();

      render(
        <ResizeHandleVertical
          onResize={onResizeSpy}
          step={20}
          width={100}
          minWidth={50}
          maxWidth={150}
        />
      );
    });

    describe('when a change event occurs on the slider', function () {
      beforeEach(function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 80 } });
      });

      it('should call to resize the width', function () {
        expect(onResizeSpy).to.have.been.called;
      });

      it('should call resize with the new width', function () {
        expect(onResizeSpy).to.have.been.calledWith(80);
      });
    });

    describe('when its attempted to be resized out of its bounds', function () {
      it('should stick to the upper bounds', function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 1234 } });
        expect(onResizeSpy).to.have.been.calledWith(150);
      });

      it('should stick to the lower bounds', function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 10 } });
        expect(onResizeSpy).to.have.been.calledWith(50);
      });
    });

    it('when focused, after mouse up it should unfocus', function () {
      const actionableElement = screen.getByRole('slider');
      actionableElement.focus();
      expect(actionableElement.ownerDocument.activeElement).to.equal(
        actionableElement
      );
      fireEvent.mouseUp(actionableElement);
      expect(actionableElement.ownerDocument.activeElement).to.not.equal(
        actionableElement
      );
    });
  });

  describe('ResizeHandleHorizontal Component', function () {
    let onResizeSpy: sinon.SinonSpy;
    beforeEach(function () {
      onResizeSpy = sinon.spy();

      render(
        <ResizeHandleHorizontal
          onResize={onResizeSpy}
          step={20}
          height={100}
          minHeight={50}
          maxHeight={150}
        />
      );
    });

    describe('when a change event occurs on the slider', function () {
      beforeEach(function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 80 } });
      });

      it('should call to resize the width', function () {
        expect(onResizeSpy).to.have.been.called;
      });

      it('should call resize with the new width', function () {
        expect(onResizeSpy).to.have.been.calledWith(80);
      });
    });

    describe('when its attempted to be resized out of its bounds', function () {
      it('should stick to the upper bounds', function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 1234 } });
        expect(onResizeSpy).to.have.been.calledWith(150);
      });
    });

    it('when focused, after mouse up it should unfocus', function () {
      const actionableElement = screen.getByRole('slider');
      actionableElement.focus();
      expect(actionableElement.ownerDocument.activeElement).to.equal(
        actionableElement
      );
      fireEvent.mouseUp(actionableElement);
      expect(actionableElement.ownerDocument.activeElement).to.not.equal(
        actionableElement
      );
    });

    // describe('when is it dragging', function() {
    //   beforeEach(function() {
    //     const actionableElement = screen.getByRole('slider');
    //     fireEvent.mouseDown(actionableElement);
    //   });
    //   describe('when the mouse is moved' , function() {
    //     it('it should call to resize with the event movement', function () {
    //       const actionableElement = screen.getByRole('slider');
    //       fireEvent.mouseMove(actionableElement, {
    //         movementY: -50
    //       });
    //       expect(onResizeSpy).to.have.been.calledWith(150);
    //     });
    //   });
    // });
  });
});
