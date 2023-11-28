import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import Sinon from 'sinon';

import { SavedItemCard } from './saved-item-card';

const now = Date.now();

describe('SavedItemCard', function () {
  beforeEach(function () {
    Sinon.stub(Date, 'now').callsFake(() => now);
  });

  afterEach(function () {
    Sinon.restore();
    cleanup();
  });

  it('should render a card with provided props', function () {
    render(
      <SavedItemCard
        id="123"
        name="My Awesome Query"
        type="query"
        database="sample_airbnb"
        collection="listingsAndReviews"
        onAction={() => {}}
        lastModified={now}
      ></SavedItemCard>
    );

    expect(screen.getByText('My Awesome Query')).to.exist;
    expect(screen.getByText('.find')).to.exist;
    expect(screen.getByText('sample_airbnb')).to.exist;
    expect(screen.getByText('listingsAndReviews')).to.exist;
    expect(screen.getByText('Last modified: now')).to.exist;
  });

  it('should render a card with an update query props', function () {
    render(
      <SavedItemCard
        id="123"
        name="My Awesome Update Query"
        type="updatemany"
        database="sample_airbnb"
        collection="listingsAndReviews"
        onAction={() => {}}
        lastModified={now}
      ></SavedItemCard>
    );

    expect(screen.getByText('My Awesome Update Query')).to.exist;
    expect(screen.getByText('.updatemany')).to.exist;
    expect(screen.getByText('sample_airbnb')).to.exist;
    expect(screen.getByText('listingsAndReviews')).to.exist;
    expect(screen.getByText('Last modified: now')).to.exist;
  });

  it('should emit an "open" action on click / space / enter', function () {
    const onAction = Sinon.spy();

    render(
      <SavedItemCard
        id="123"
        name="My Awesome Query"
        type="query"
        database="sample_airbnb"
        collection="listingsAndReviews"
        onAction={onAction}
        lastModified={now}
        tabIndex={0}
      ></SavedItemCard>
    );

    userEvent.click(screen.getByText('My Awesome Query'));
    userEvent.keyboard('{space}');
    userEvent.keyboard('{enter}');

    expect(onAction).to.have.callCount(3);
    expect(onAction.getCalls().map((call) => call.args)).to.deep.eq([
      ['123', 'open'],
      ['123', 'open'],
      ['123', 'open'],
    ]);
  });

  it('should emit a "delete" action on delete', function () {
    const onAction = Sinon.spy();

    render(
      <SavedItemCard
        id="123"
        name="My Awesome Query"
        type="query"
        database="sample_airbnb"
        collection="listingsAndReviews"
        onAction={onAction}
        lastModified={now}
        tabIndex={0}
      ></SavedItemCard>
    );

    userEvent.hover(screen.getByText('My Awesome Query'));
    userEvent.click(
      screen.getByRole('button', {
        name: /show actions/i,
      })
    );
    userEvent.click(screen.getByText('Delete'));

    expect(onAction).to.have.callCount(1);
    expect(onAction.getCalls().map((call) => call.args)).to.deep.eq([
      ['123', 'delete'],
    ]);
  });
});
