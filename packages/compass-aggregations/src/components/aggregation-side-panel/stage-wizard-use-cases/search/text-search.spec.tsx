import React, { type ComponentProps } from 'react';
import { TextSearch } from './text-search';
import { screen, render } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  setComboboxValue,
  setInputElementValueByTestId,
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
    expect(screen.getByText('maxEdits')).to.exist;
    expect(screen.getByText('for all documents where')).to.exist;
    expect(screen.getByText('contains')).to.exist;
    expect(screen.getByText('using')).to.exist;
  });

  context('calls onChange', function () {
    it('for text search with fields', () => {
      setSelectValue(/select search type/i, 'text search');
      setSelectValue(/select search path/i, 'field names');
      setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
        'a',
        'c',
      ]);
      setInputElementValueByTestId('text-search-contains-input', 'abc');
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

    it('for text search with any fields', () => {
      setSelectValue(/select search type/i, 'text search');
      setSelectValue(/select search path/i, 'any fields');

      setInputElementValueByTestId('text-search-contains-input', 'abc');
      setComboboxValue(/select or type a search index/i, 'index1');

      expect(onChangeSpy.lastCall.firstArg).to.equal(
        JSON.stringify({
          index: 'index1',
          text: {
            query: 'abc',
            path: {
              wildcard: '*',
            },
          },
        })
      );
      expect(onChangeSpy.lastCall.lastArg).to.be.null;
    });

    it('for fuzzy search with fields', () => {
      setSelectValue(/select search type/i, 'fuzzy search');
      setInputElementValueByTestId('maxEdits-input', '1');

      setSelectValue(/select search path/i, 'field names');
      setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
        'a',
        'b',
      ]);

      setInputElementValueByTestId('text-search-contains-input', 'def');
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

    it('for fuzzy search with any fields', () => {
      setSelectValue(/select search type/i, 'fuzzy search');
      setInputElementValueByTestId('maxEdits-input', '2');

      setSelectValue(/select search path/i, 'any fields');

      setInputElementValueByTestId('text-search-contains-input', 'xyz');
      setComboboxValue(/select or type a search index/i, 'index2');

      expect(onChangeSpy.lastCall.firstArg).to.equal(
        JSON.stringify({
          index: 'index2',
          text: {
            query: 'xyz',
            path: {
              wildcard: '*',
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
      setSelectValue(/select search type/i, 'fuzzy search');
      {
        setInputElementValueByTestId('maxEdits-input', '0');
        expect(onChangeSpy.lastCall.lastArg).to.be.an.instanceOf(Error);
      }
      {
        setInputElementValueByTestId('maxEdits-input', '3');
        expect(onChangeSpy.lastCall.lastArg).to.be.an.instanceOf(Error);
      }
    });

    it('should validate fields', function () {
      setSelectValue(/select search path/i, 'field names');
      expect(onChangeSpy.lastCall.lastArg).to.be.an.instanceOf(Error);
    });

    it('should validate search term', function () {
      setInputElementValueByTestId('text-search-contains-input', 'xyz');
      setInputElementValueByTestId('text-search-contains-input', '');
      expect(onChangeSpy.lastCall.lastArg).to.be.an.instanceOf(Error);
    });
  });
});
