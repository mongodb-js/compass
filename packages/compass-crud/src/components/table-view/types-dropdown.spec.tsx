import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Element } from 'hadron-document';

import app from 'hadron-app';
import TypesDropdown from './types-dropdown';

const selectableTypes = [
  'Array',
  'Binary',
  'Boolean',
  'Code',
  'Date',
  'Decimal128',
  'Double',
  // 'Int32', initially selected
  'Int64',
  'MaxKey',
  'MinKey',
  'Null',
  'Object',
  'ObjectId',
  'BSONRegExp',
  'String',
  'BSONSymbol',
  'Timestamp',
  'Undefined',
];

describe('TypesDropdown', function () {
  let hadronAppBkp;
  let element;
  beforeEach(function () {
    hadronAppBkp = global.hadronApp;
    global.hadronApp = app;
    element = new Element('name', 1, null, false);
    render(<TypesDropdown element={element}></TypesDropdown>);
  });

  afterEach(function () {
    global.hadronApp = hadronAppBkp;
    cleanup();
  });

  it('should render a dropdown with types', function () {
    expect(screen.getByTestId('table-view-types-dropdown-select')).to.exist;
  });

  it('should show the initial type', function () {
    expect(screen.getByText('Int32')).to.exist;
  });

  selectableTypes.forEach((type) => {
    it(`allows to select ${type}`, function () {
      fireEvent.click(screen.getByTestId('table-view-types-dropdown-select')); // Click select button
      expect(screen.getByText(type)).to.exist;
    });
  });

  describe('when a type is selected', function () {
    beforeEach(function () {
      fireEvent.click(screen.getByTestId('table-view-types-dropdown-select')); // Click select button
      fireEvent.click(screen.getByText('String')); // Click type
    });

    it('changes the element current type', function () {
      expect(element.currentType).to.equal('String');
    });

    it('changes the element current value', function () {
      expect(element.currentValue).to.equal('1');
    });
  });
});
