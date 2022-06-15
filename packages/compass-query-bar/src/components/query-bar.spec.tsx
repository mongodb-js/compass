import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';

import { QueryBar } from './query-bar';

const noop = () => {
  /* no op */
};

const queryOptionProps = {
  filterValid: true,
  filterString: '',

  projectValid: true,
  projectString: '',

  sortValid: true,
  sortString: '',

  collationValid: true,
  collationString: '',

  skipValid: true,
  skipString: '',

  limitValid: true,
  limitString: '',

  maxTimeMSValid: true,
  maxTimeMSString: '',
};

const renderQueryBar = (
  props: Partial<ComponentProps<typeof QueryBar>> = {}
) => {
  // const defaultQueryOptions: QueryOption[] = ['project', 'sort', 'collation', 'skip', 'limit', 'maxTimeMS'];

  render(
    <QueryBar
      buttonLabel="Apply"
      expanded={false}
      // queryOptions={['project', 'sort', 'collation', 'skip', 'limit', 'maxTimeMS']}
      onApply={noop}
      onChangeQueryOption={noop}
      onReset={noop}
      queryState="apply"
      refreshEditorAction={
        {
          listen: () => {
            return noop;
          },
        } as any
      }
      schemaFields={[]}
      serverVersion="123"
      showQueryHistoryButton
      toggleExpandQueryOptions={noop}
      toggleQueryHistory={noop}
      valid
      {...queryOptionProps}
      {...props}
    />
  );
};

describe('QueryBar Component', function () {
  let onApplySpy: SinonSpy;
  let onResetSpy: SinonSpy;
  let toggleQueryHistorySpy: SinonSpy;
  let toggleExpandQueryOptionsSpy: SinonSpy;
  beforeEach(function () {
    onApplySpy = sinon.spy();
    onResetSpy = sinon.spy();
    toggleQueryHistorySpy = sinon.spy();
    toggleExpandQueryOptionsSpy = sinon.spy();
  });

  describe('when rendered', function () {
    beforeEach(function () {
      renderQueryBar({
        onApply: onApplySpy,
        onReset: onResetSpy,
        toggleQueryHistory: toggleQueryHistorySpy,
        toggleExpandQueryOptions: toggleExpandQueryOptionsSpy,
      });
    });

    it('renders the filter input', function () {
      const filterInput = screen.getByRole('textbox');
      expect(filterInput).to.exist;
      expect(filterInput).to.have.attribute(
        'id',
        'query-bar-option-input-filter'
      );

      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(1);
    });

    it('calls toggleExpandQueryOptionsSpy when the expand button is clicked', function () {
      const expandButton = screen.getByText('More Options');
      expect(expandButton).to.exist;

      const queryInputsBeforeExpand = screen.getAllByRole('textbox');
      expect(queryInputsBeforeExpand.length).to.equal(1);

      userEvent.click(expandButton);

      expect(toggleExpandQueryOptionsSpy).to.have.been.calledOnce;
    });
  });

  describe('when expanded', function () {
    beforeEach(function () {
      renderQueryBar({
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
        toggleQueryHistory: toggleQueryHistorySpy,
        toggleExpandQueryOptions: toggleExpandQueryOptionsSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(7);
    });
  });

  describe('with one query option', function () {
    beforeEach(function () {
      renderQueryBar({
        queryOptions: ['project'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
        toggleQueryHistory: toggleQueryHistorySpy,
        toggleExpandQueryOptions: toggleExpandQueryOptionsSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(2);
    });
  });

  describe('with two query options', function () {
    beforeEach(function () {
      renderQueryBar({
        queryOptions: ['project', 'sort'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
        toggleQueryHistory: toggleQueryHistorySpy,
        toggleExpandQueryOptions: toggleExpandQueryOptionsSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(3);
    });
  });

  describe('with three query options', function () {
    beforeEach(function () {
      renderQueryBar({
        queryOptions: ['project', 'sort', 'collation'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
        toggleQueryHistory: toggleQueryHistorySpy,
        toggleExpandQueryOptions: toggleExpandQueryOptionsSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(4);
    });
  });

  describe('with four query options', function () {
    beforeEach(function () {
      renderQueryBar({
        queryOptions: ['project', 'sort', 'collation', 'limit'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
        toggleQueryHistory: toggleQueryHistorySpy,
        toggleExpandQueryOptions: toggleExpandQueryOptionsSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(5);
    });
  });
});
