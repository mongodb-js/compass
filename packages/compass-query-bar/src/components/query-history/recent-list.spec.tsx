import React from 'react';
import { expect } from 'chai';
import Sinon from 'sinon';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  describe('readonly mode', function () {
    describe('for update queries', function () {
      beforeEach(function () {
        renderRecentList({
          onApply: onApplySpy,
          isReadonly: true,
          queries: [
            {
              filter: { a: 1 },
              update: { $set: { a: 2 } },
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
              filter: { a: 1 },
              update: { $set: { a: 2 } },
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
