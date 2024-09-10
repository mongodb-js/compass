import React from 'react';
import { expect } from 'chai';
import { render, screen, cleanup } from '@mongodb-js/testing-library-compass';
import { ChangeView } from './change-view';
import { fixtureGroups } from '../../../test/before-after-fixtures';

function renderChangeView(
  props?: Partial<React.ComponentProps<typeof ChangeView>>
) {
  return render(<ChangeView name="test" before={{}} after={{}} {...props} />);
}

describe('ChangeView Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('renders', function () {
    renderChangeView({
      before: { a: 1 },
      after: { b: 2 },
    });

    expect(screen.getByTestId('change-view-test')).to.exist;
  });

  for (const group of fixtureGroups) {
    context(group.name, function () {
      for (const { name, before, after } of group.fixtures) {
        it(name, function () {
          renderChangeView({
            name,
            before,
            after,
          });

          // A bit primitive. Just trying to see if there are any errors as a
          // sort of regression test. Not sure how to write an assertion that
          // would workfor each one.
          expect(screen.getByTestId(`change-view-${name}`)).to.exist;
        });
      }
    });
  }
});
