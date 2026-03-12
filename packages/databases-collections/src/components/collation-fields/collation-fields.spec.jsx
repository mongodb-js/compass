import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import Collation from '.';

describe('CollationFields [Component]', function () {
  let changeCollationOptionSpy;

  beforeEach(function () {
    changeCollationOptionSpy = sinon.spy();
  });

  afterEach(function () {
    changeCollationOptionSpy = null;
  });

  it('renders the collation option dropdowns', function () {
    render(
      <Collation
        collation={{}}
        changeCollationOption={changeCollationOptionSpy}
      />
    );
    // There are 9 collation option Select dropdowns
    // Each Select has a button with the collation field name as its accessible name
    const collationFields = [
      'locale',
      'strength',
      'caseLevel',
      'caseFirst',
      'numericOrdering',
      'alternate',
      'maxVariable',
      'backwards',
      'normalization',
    ];
    for (const field of collationFields) {
      expect(screen.getByRole('button', { name: field })).to.exist;
    }
  });
});
