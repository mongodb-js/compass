import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { ResizeHandle, ResizeDirection } from './resize-handle';

describe('ResizeHandle Component', function () {
  afterEach(function () {
    cleanup();
  });

  describe('resize direction RIGHT', function () {
    let onChangeSpy: sinon.SinonSpy;
    beforeEach(function () {
      onChangeSpy = sinon.spy();

      render(
        <ResizeHandle
          direction={ResizeDirection.RIGHT}
          onChange={onChangeSpy}
          step={20}
          value={100}
          minValue={50}
          maxValue={150}
          title="Pineapple"
        />
      );
    });

    it('should render the title in the aria description', function () {
      const actionableElement = screen.getByRole('slider');
      expect(actionableElement.getAttribute('aria-label')).to.equal(
        'Width of the Pineapple, resize using arrow keys'
      );
    });

    describe('when a change event occurs on the slider', function () {
      beforeEach(function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 80 } });
      });

      it('should call to resize the width', function () {
        expect(onChangeSpy).to.have.been.called;
      });

      it('should call resize with the new width', function () {
        expect(onChangeSpy).to.have.been.calledWith(80);
      });
    });

    describe('when its attempted to be resized out of its bounds', function () {
      it('should stick to the upper bounds', function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 1234 } });
        expect(onChangeSpy).to.have.been.calledWith(150);
      });

      it('should stick to the lower bounds', function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 10 } });
        expect(onChangeSpy).to.have.been.calledWith(50);
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

  describe('resize direction TOP', function () {
    let onChangeSpy: sinon.SinonSpy;
    beforeEach(function () {
      onChangeSpy = sinon.spy();

      render(
        <ResizeHandle
          direction={ResizeDirection.TOP}
          onChange={onChangeSpy}
          step={20}
          value={100}
          minValue={50}
          maxValue={150}
          title="Pineapple"
        />
      );
    });

    it('should render the title in the aria description', function () {
      const actionableElement = screen.getByRole('slider');
      expect(actionableElement.getAttribute('aria-label')).to.equal(
        'Height of the Pineapple, resize using arrow keys'
      );
    });

    describe('when a change event occurs on the slider', function () {
      beforeEach(function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 80 } });
      });

      it('should call to resize the width', function () {
        expect(onChangeSpy).to.have.been.called;
      });

      it('should call resize with the new width', function () {
        expect(onChangeSpy).to.have.been.calledWith(80);
      });
    });

    describe('when its attempted to be resized out of its bounds', function () {
      it('should stick to the upper bounds', function () {
        const actionableElement = screen.getByRole('slider');
        fireEvent.change(actionableElement, { target: { value: 1234 } });
        expect(onChangeSpy).to.have.been.calledWith(150);
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
});
