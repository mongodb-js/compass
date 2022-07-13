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

const exportToLanguageButtonId = 'query-bar-open-export-to-language-button';
const queryHistoryButtonId = 'query-history-button';

const renderQueryBar = (
  props: Partial<ComponentProps<typeof QueryBar>> = {}
) => {
  render(
    <QueryBar
      buttonLabel="Apply"
      expanded={false}
      onApply={noop}
      onChangeQueryOption={noop}
      onOpenExportToLanguage={noop}
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
      showExportToLanguageButton
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
  let onOpenExportToLanguageSpy: SinonSpy;
  beforeEach(function () {
    onApplySpy = sinon.spy();
    onResetSpy = sinon.spy();
    onOpenExportToLanguageSpy = sinon.spy();
    toggleQueryHistorySpy = sinon.spy();
    toggleExpandQueryOptionsSpy = sinon.spy();
  });

  describe('when rendered', function () {
    beforeEach(function () {
      renderQueryBar({
        onApply: onApplySpy,
        onReset: onResetSpy,
        onOpenExportToLanguage: onOpenExportToLanguageSpy,
        showExportToLanguageButton: true,
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

    it('calls onOpenExportToLanguage when the export to pipeline button is clicked', function () {
      const exportToLanguageButton = screen.getByTestId(
        exportToLanguageButtonId
      );
      expect(exportToLanguageButton).to.exist;

      expect(onOpenExportToLanguageSpy).to.not.have.been.called;
      userEvent.click(exportToLanguageButton);

      expect(onOpenExportToLanguageSpy).to.have.been.calledOnce;
    });

    it('calls toggleQueryHistory when the query history button is clicked', function () {
      const queryHistoryButton = screen.getByTestId(queryHistoryButtonId);
      expect(queryHistoryButton).to.exist;

      expect(toggleQueryHistorySpy).to.not.have.been.called;
      userEvent.click(queryHistoryButton);

      expect(toggleQueryHistorySpy).to.have.been.calledOnce;
    });

    it('calls onClick when the expand button is clicked', function () {
      const expandButton = screen.getByText('More Options');
      expect(expandButton).to.exist;

      const queryInputsBeforeExpand = screen.getAllByRole('textbox');
      expect(queryInputsBeforeExpand.length).to.equal(1);

      expect(toggleExpandQueryOptionsSpy).to.not.have.been.called;
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

  describe('when showExportToLanguageButton is false', function () {
    beforeEach(function () {
      renderQueryBar({
        showExportToLanguageButton: false,
      });
    });

    it('does not render the exportToLanguage button', function () {
      const exportToLanguageButton = screen.queryByTestId(
        'exportToLanguageButtonId'
      );
      expect(exportToLanguageButton).to.not.exist;
    });
  });

  describe('when query history is clicked', function () {
    beforeEach(function () {
      renderQueryBar({
        toggleQueryHistory: toggleQueryHistorySpy,
      });
    });

    it('does not render the query history button', function () {
      const queryHistoryButton = screen.queryByTestId('queryHistoryButtonIdId');
      expect(queryHistoryButton).to.not.exist;
    });
  });

  describe('when showQueryHistoryButton is false', function () {
    beforeEach(function () {
      renderQueryBar({
        showQueryHistoryButton: false,
      });
    });

    it('does not render the query history button', function () {
      const exportToLanguageButton = screen.queryByTestId(
        'exportToLanguageButtonId'
      );
      expect(exportToLanguageButton).to.not.exist;
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
