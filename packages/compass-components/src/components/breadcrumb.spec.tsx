import React from 'react';
import { expect } from 'chai';
import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@mongodb-js/testing-library-compass';
import { Breadcrumbs } from './breadcrumb';
import sinon from 'sinon';

describe('Breadcrumbs Component', function () {
  afterEach(cleanup);

  it('renders nothing when list is empty', function () {
    render(<Breadcrumbs items={[]} />);
    expect(screen.getByTestId('breadcrumbs').children.length).to.equal(0);
  });

  it('renders a single item and does not call onClick when clicked', function () {
    const onClick = sinon.spy();
    render(<Breadcrumbs items={[{ name: 'test', onClick }]} />);
    expect(screen.getByText('test')).to.exist;
    fireEvent.click(screen.getByText('test'));
    expect(onClick).to.not.have.been.called;
  });

  it('renders multiple items and calls onClick', function () {
    const onClick1 = sinon.spy();
    const onClick2 = sinon.spy();
    render(
      <Breadcrumbs
        items={[
          { name: 'test', onClick: onClick1 },
          { name: 'test2', onClick: onClick2 },
        ]}
      />
    );
    expect(screen.getByText('test')).to.exist;
    expect(screen.getByText('test2')).to.exist;

    fireEvent.click(screen.getByText('test'));
    expect(onClick1).to.have.been.called;
    expect(onClick2).to.not.have.been.called;

    fireEvent.click(screen.getByText('test2'));
    expect(onClick2).to.not.have.been.called;
  });

  it('renders chevron between items', function () {
    render(
      <Breadcrumbs
        items={[
          { name: 'test', onClick: () => {} },
          { name: 'test2', onClick: () => {} },
        ]}
      />
    );
    expect(screen.getByText('test')).to.exist;
    expect(screen.getByText('test2')).to.exist;

    const icons = screen.getAllByLabelText('Chevron Right Icon');
    expect(icons.length).to.equal(1);
  });
});
