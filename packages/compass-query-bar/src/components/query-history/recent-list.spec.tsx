import React from 'react';
import { expect } from 'chai';
import Sinon from 'sinon';
import {
  render,
  screen,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';

import { RecentList } from './recent-list';

function renderRecentList(
  props?: Partial<React.ComponentProps<typeof RecentList>>
) {
  return render(
    <RecentList
      onApply={props?.onApply || Sinon.spy()}
      onDelete={props?.onDelete || Sinon.spy()}
      onSaveFavorite={props?.onSaveFavorite || Sinon.spy()}
      onFavorite={props?.onFavorite || Sinon.spy()}
      onUpdateRecentChoosen={props?.onUpdateRecentChoosen || Sinon.spy()}
      queries={props?.queries || []}
      isReadonly={props?.isReadonly || false}
      {...props}
    />
  );
}

describe('Recent List [Component]', function () {
  let onApplySpy: Sinon.SinonSpy;
  let onUpdateRecentChoosenSpy: Sinon.SinonSpy;

  beforeEach(function () {
    onApplySpy = Sinon.spy();
    onUpdateRecentChoosenSpy = Sinon.spy();
  });

  afterEach(cleanup);

  describe('with saved query strings', function () {
    const query = {
      _id: '0f92b5fa-19fe-4200-a4bb-d25765bce8a2',
      _ns: 'db.coll',
      _lastExecuted: new Date(),
      filter: "{\n  // a comment\n  count: NumberLong('9007199254740993')\n}",
      sort: '{ count: -1 }',
      limit: 10,
    };

    it('copies the query with its BSON values and comments', async function () {
      renderRecentList({ queries: [query] });
      userEvent.hover(screen.getByTestId('recent-query-list-item'));
      userEvent.click(screen.getByTestId('query-history-button-copy-query'));

      expect(await navigator.clipboard.readText()).to.equal(`{
  filter: {
    // a comment
    count: NumberLong("9007199254740993")
  },
  sort: { count: -1 },
  limit: 10
}`);
    });

    it('applies the saved query strings as they are', function () {
      renderRecentList({ onApply: onApplySpy, queries: [query] });
      userEvent.click(screen.getByTestId('recent-query-list-item'));

      expect(onApplySpy).to.have.been.calledOnceWithExactly({
        filter: query.filter,
        sort: query.sort,
        limit: query.limit,
      });
    });
  });

  describe('readonly mode', function () {
    describe('for update queries', function () {
      beforeEach(function () {
        renderRecentList({
          onApply: onApplySpy,
          isReadonly: true,
          queries: [
            {
              _id: 1,
              filter: '{ a: 1 }',
              update: '{ $set: { a: 2 } }',
              _lastExecuted: new Date(),
            } as any,
          ],
        });
      });

      it('does nothing when clicked', function () {
        const queryItem = screen.getByTestId('recent-query-list-item');
        userEvent.click(queryItem);

        expect(onApplySpy).to.not.be.called;
      });
    });
  });

  describe('writeable mode', function () {
    describe('for update queries', function () {
      beforeEach(function () {
        renderRecentList({
          onUpdateRecentChoosen: onUpdateRecentChoosenSpy,
          onApply: onApplySpy,
          isReadonly: false,
          queries: [
            {
              _id: 1,
              filter: '{ a: 1 }',
              update: '{ $set: { a: 2 } }',
              _lastExecuted: new Date(),
            } as any,
          ],
        });
      });

      it('calls on apply when clicked', function () {
        const queryItem = screen.getByTestId('recent-query-list-item');
        userEvent.click(queryItem);

        expect(onApplySpy).to.have.been.called;
        expect(onUpdateRecentChoosenSpy).to.have.been.called;
      });
    });
  });
});
