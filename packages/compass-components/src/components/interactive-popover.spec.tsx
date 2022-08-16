import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { InteractivePopover } from './interactive-popover';

const innerContentTestId = 'testing-inner-content';

function renderPopover(
  props?: Partial<React.ComponentProps<typeof InteractivePopover>>
) {
  const openSpy = sinon.spy();

  const popoverContent = ({ onClose }) => (
    <>
      <button onClick={() => {}} data-testid={innerContentTestId}>
        Action Button
      </button>
      <div>inner content</div>
      <button onClick={onClose}>Close Button</button>
    </>
  );

  return render(
    <InteractivePopover
      className=""
      open={false}
      setOpen={openSpy}
      trigger={({ onClick, ref, children }) => (
        <>
          <button onClick={onClick} ref={ref}>
            Trigger Button Text
          </button>
          {children}
        </>
      )}
      {...props}
    >
      {popoverContent}
    </InteractivePopover>
  );
}

describe('InteractivePopover Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('when open it should show the popover content', function () {
    renderPopover({
      open: true,
    });
    expect(screen.getByTestId(innerContentTestId)).to.be.visible;
  });

  it('when closed it should not show the popover content', function () {
    renderPopover({
      open: false,
    });
    expect(screen.queryByTestId(innerContentTestId)).to.not.exist;
  });

  it('should render the trigger', function () {
    renderPopover({
      open: false,
    });
    const button = screen.getByRole('button');
    expect(button).to.be.visible;
    expect(screen.getByText('Trigger Button Text')).to.be.visible;
  });

  it('when closed and the trigger is clicked it should call to open', function () {
    const openSpy = sinon.fake();

    renderPopover({
      open: false,
      setOpen: openSpy,
    });
    expect(openSpy.calledOnce).to.be.false;

    const button = screen.getByText('Trigger Button Text');
    button.click();
    expect(openSpy.calledOnce).to.be.true;
    expect(openSpy.firstCall.firstArg).to.equal(true);
  });

  it('when open and the trigger is clicked it should call to close', function () {
    const openSpy = sinon.fake();

    renderPopover({
      open: true,
      setOpen: openSpy,
    });
    expect(openSpy.calledOnce).to.be.false;

    const button = screen.getByText('Trigger Button Text');
    button.click();
    expect(openSpy.calledOnce).to.be.true;
    expect(openSpy.firstCall.firstArg).to.equal(false);
  });
});
