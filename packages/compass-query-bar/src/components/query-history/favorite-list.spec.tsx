import React from 'react';
import { expect } from 'chai';
import Sinon from 'sinon';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FavoriteList } from './favorite-list';

function renderFavoriteList(
  props?: Partial<React.ComponentProps<typeof FavoriteList>>
) {
  return render(
    <FavoriteList
      onApply={props?.onApply || Sinon.spy()}
      onDelete={props?.onDelete || Sinon.spy()}
      onUpdateFavoriteChoosen={props?.onUpdateFavoriteChoosen || Sinon.spy()}
      queries={props?.queries || []}
      isReadonly={props?.isReadonly || false}
      {...props}
    />
  );
}

describe('Favorite List [Component]', function () {
  let onApplySpy: Sinon.SinonSpy;
  let onUpdateFavoriteChoosenSpy: Sinon.SinonSpy;

  beforeEach(function () {
    onApplySpy = Sinon.spy();
    onUpdateFavoriteChoosenSpy = Sinon.spy();
  });

  afterEach(cleanup);

  describe('readonly mode', function () {
    describe('for update queries', function () {
      beforeEach(function () {
        renderFavoriteList({
          onApply: onApplySpy,
          isReadonly: true,
          queries: [
            {
              filter: { a: 1 },
              update: { $set: { a: 2 } },
            } as any,
          ],
        });
      });

      it('does nothing when clicked', function () {
        const queryItem = screen.getByTestId('favorite-query-list-item');
        userEvent.click(queryItem);

        expect(onApplySpy).to.not.be.called;
      });
    });
  });

  describe('writeable mode', function () {
    describe('for update queries', function () {
      beforeEach(function () {
        renderFavoriteList({
          onUpdateFavoriteChoosen: onUpdateFavoriteChoosenSpy,
          onApply: onApplySpy,
          isReadonly: false,
          queries: [
            {
              filter: { a: 1 },
              update: { $set: { a: 2 } },
            } as any,
          ],
        });
      });

      it('calls on apply when clicked', function () {
        const queryItem = screen.getByTestId('favorite-query-list-item');
        userEvent.click(queryItem);

        expect(onApplySpy).to.have.been.called;
        expect(onUpdateFavoriteChoosenSpy).to.have.been.called;
      });
    });
  });
});
