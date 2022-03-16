import React from 'react';
import { expect } from 'chai';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sinon from 'sinon';
import DocumentActionsGroup from './document-actions-group';

describe('DocumentActionsGroup', function () {
  afterEach(cleanup);

  it('should render Edit action', function () {
    const spy = Sinon.spy();
    render(<DocumentActionsGroup onEdit={spy}></DocumentActionsGroup>);
    expect(screen.getByTitle('Edit document')).to.exist;
    userEvent.click(screen.getByTitle('Edit document'), undefined, {
      // Leafygreen applies pointer-event: none to the element that renders
      // label inside the button, so even though click does work (the listener
      // is not attached to the button label), we have to enable this option
      // when selecting element for the click
      skipPointerEventsCheck: true,
    });
    expect(spy).to.be.calledOnce;
  });

  it('should render Copy action', function () {
    const spy = Sinon.spy();
    render(<DocumentActionsGroup onCopy={spy}></DocumentActionsGroup>);
    expect(screen.getByTitle('Copy document')).to.exist;
    userEvent.click(screen.getByTitle('Copy document'), undefined, {
      // See above
      skipPointerEventsCheck: true,
    });
    expect(spy).to.be.calledOnce;
  });

  it('should render Clone action', function () {
    const spy = Sinon.spy();
    render(<DocumentActionsGroup onClone={spy}></DocumentActionsGroup>);
    expect(screen.getByTitle('Clone document')).to.exist;
    userEvent.click(screen.getByTitle('Clone document'), undefined, {
      // See above
      skipPointerEventsCheck: true,
    });
    expect(spy).to.be.calledOnce;
  });

  it('should render Remove action', function () {
    const spy = Sinon.spy();
    render(<DocumentActionsGroup onRemove={spy}></DocumentActionsGroup>);
    expect(screen.getByTitle('Remove document')).to.exist;
    userEvent.click(screen.getByTitle('Remove document'), undefined, {
      // See above
      skipPointerEventsCheck: true,
    });
    expect(spy).to.be.calledOnce;
  });

  it('should render Expand action', function () {
    const spy = Sinon.spy();
    render(
      <DocumentActionsGroup
        onExpand={spy}
        expanded={false}
      ></DocumentActionsGroup>
    );
    expect(screen.getByTitle('Expand all')).to.exist;
    userEvent.click(screen.getByTitle('Expand all'), undefined, {
      // See above
      skipPointerEventsCheck: true,
    });
    expect(spy).to.be.calledOnce;
  });
});
