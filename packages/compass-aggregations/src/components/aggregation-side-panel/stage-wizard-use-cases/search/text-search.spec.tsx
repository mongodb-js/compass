import React, { type ComponentProps } from 'react';
import { TextSearch } from './text-search';
import { screen, render } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  setComboboxValue,
  setInputElementValue,
  setMultiSelectComboboxValues,
  setSelectValue,
} from '../../../../../test/form-helper';
import { MULTI_SELECT_LABEL } from '../field-combobox';

const FIELDS = [
  { name: 'a', type: 'string' },
  { name: 'b', type: 'string' },
  { name: 'c', type: 'string' },
] as any;

const SEARCH_INDEXES = [{ name: 'index1' }, { name: 'index2' }] as any;

const renderTextSearch = (
  props: Partial<ComponentProps<typeof TextSearch>> = {}
) => {
  render(
    <TextSearch
      fields={[]}
      indexes={[]}
      indexesStatus={'INITIAL'}
      onFetchIndexes={() => {}}
      onChange={() => {}}
      {...props}
    />
  );
};

describe('TextSearch', function () {
  const onChangeSpy = sinon.spy();

  beforeEach(function () {
    renderTextSearch({
      onChange: onChangeSpy,
      fields: FIELDS,
      indexes: SEARCH_INDEXES,
      indexesStatus: 'READY',
    });
  });

  afterEach(function () {
    onChangeSpy.resetHistory();
  });

  it('should render the component', () => {
    expect(screen.getByText('Perform a')).to.exist;
    expect(screen.getByText('with maxEdits')).to.exist;
    expect(screen.getByText('for all documents where')).to.exist;
    expect(screen.getByText('contains')).to.exist;
    expect(screen.getByText('using')).to.exist;
  });

  context('calls onChange', function () {
    it('for text search with fields', () => {
      setSelectValue(/select search type/i, 'text-search');
      setSelectValue(/select search path/i, 'field names');
      setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
        'a',
        'c',
      ]);
      setInputElementValue(/text/i, 'abc');
      setComboboxValue(/select or type a search index/i, 'index1');

      expect(onChangeSpy.lastCall.firstArg).to.equal(
        JSON.stringify({
          index: 'index1',
          text: {
            query: 'abc',
            path: ['a', 'c'],
          },
        })
      );
      expect(onChangeSpy.lastCall.lastArg).to.be.null;
    });

    it('for text search with wildcard', () => {
      setSelectValue(/select search type/i, 'text-search');
      setSelectValue(/select search path/i, 'wildcard');
      setInputElementValue(/Wildcard/i, 'path.*');

      setInputElementValue(/text/i, 'abc');
      setComboboxValue(/select or type a search index/i, 'index1');

      expect(onChangeSpy.lastCall.firstArg).to.equal(
        JSON.stringify({
          index: 'index1',
          text: {
            query: 'abc',
            path: {
              wildcard: 'path.*',
            },
          },
        })
      );
      expect(onChangeSpy.lastCall.lastArg).to.be.null;
    });

    it('for fuzzy search with fields', () => {
      setSelectValue(/select search type/i, 'fuzzy-search');
      setInputElementValue(/maxEdits/i, '1');

      setSelectValue(/select search path/i, 'field names');
      setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
        'a',
        'b',
      ]);

      setInputElementValue(/text/i, 'def');
      setComboboxValue(/select or type a search index/i, 'index2');

      expect(onChangeSpy.lastCall.firstArg).to.equal(
        JSON.stringify({
          index: 'index2',
          text: {
            query: 'def',
            path: ['a', 'b'],
            fuzzy: {
              maxEdits: 1,
            },
          },
        })
      );
      expect(onChangeSpy.lastCall.lastArg).to.be.null;
    });

    it('for fuzzy search with wildcard', () => {
      setSelectValue(/select search type/i, 'fuzzy-search');
      setInputElementValue(/maxEdits/i, '2');

      setSelectValue(/select search path/i, 'wildcard');
      setInputElementValue(/wildcard/i, 'path.*');

      setInputElementValue(/text/i, 'xyz');
      setComboboxValue(/select or type a search index/i, 'index2');

      expect(onChangeSpy.lastCall.firstArg).to.equal(
        JSON.stringify({
          index: 'index2',
          text: {
            query: 'xyz',
            path: {
              wildcard: 'path.*',
            },
            fuzzy: {
              maxEdits: 2,
            },
          },
        })
      );
      expect(onChangeSpy.lastCall.lastArg).to.be.null;
    });
  });

  context('validation', function () {
    it('should validate maxEdits', function () {
      setSelectValue(/select search type/i, 'fuzzy-search');
      {
        setInputElementValue(/maxEdits/i, '0');
        expect(onChangeSpy.lastCall.lastArg).to.be.an.instanceOf(Error);
      }
      {
        setInputElementValue(/maxEdits/i, '3');
        expect(onChangeSpy.lastCall.lastArg).to.be.an.instanceOf(Error);
      }
    });

    it('should validate fields', function () {
      setSelectValue(/select search path/i, 'field names');
      expect(onChangeSpy.lastCall.lastArg).to.be.an.instanceOf(Error);
    });

    it('should validate search term', function () {
      setInputElementValue(/text/i, 'xyz');
      setInputElementValue(/text/i, '');
      expect(onChangeSpy.lastCall.lastArg).to.be.an.instanceOf(Error);
    });
  });
});
