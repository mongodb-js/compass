import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import AppRegistry from 'hadron-app-registry';

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
const queryHistoryComponentTestId = 'query-history-component-test-id';

const QueryHistoryMockComponent = () => (
  <div data-testid={queryHistoryComponentTestId}>
    <div>Query history</div>
    <button type="button" onClick={() => {}}>
      Button
    </button>
  </div>
);
const mockQueryHistoryRole = {
  name: 'Query History',
  // eslint-disable-next-line react/display-name
  component: QueryHistoryMockComponent,
  configureStore: () => ({}),
  configureActions: () => {},
  storeName: 'Query.History',
  actionName: 'Query.History.Actions',
};

const renderQueryBar = (
  props: Partial<ComponentProps<typeof QueryBar>> = {}
) => {
  const globalAppRegistry = new AppRegistry();
  globalAppRegistry.registerRole('Query.QueryHistory', mockQueryHistoryRole);

  const localAppRegistry = new AppRegistry();
  localAppRegistry.registerStore('Query.History', {
    onActivated: noop,
  });
  localAppRegistry.registerAction('Query.History.Actions', {
    actions: true,
  });

  render(
    <QueryBar
      buttonLabel="Apply"
      expanded={false}
      globalAppRegistry={globalAppRegistry}
      localAppRegistry={localAppRegistry}
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
      resultId="123"
      valid
      {...queryOptionProps}
      {...props}
    />
  );
};

describe('QueryBar Component', function () {
  let onApplySpy: SinonSpy;
  let onResetSpy: SinonSpy;
  let toggleExpandQueryOptionsSpy: SinonSpy;
  let onOpenExportToLanguageSpy: SinonSpy;
  beforeEach(function () {
    onApplySpy = sinon.spy();
    onResetSpy = sinon.spy();
    onOpenExportToLanguageSpy = sinon.spy();
    toggleExpandQueryOptionsSpy = sinon.spy();
  });
  afterEach(cleanup);

  describe('when rendered', function () {
    beforeEach(function () {
      renderQueryBar({
        onApply: onApplySpy,
        onReset: onResetSpy,
        onOpenExportToLanguage: onOpenExportToLanguageSpy,
        showExportToLanguageButton: true,
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

    it('calls onClick when the expand button is clicked', function () {
      const expandButton = screen.getByText('More Options');
      expect(expandButton).to.exist;

      const queryInputsBeforeExpand = screen.getAllByRole('textbox');
      expect(queryInputsBeforeExpand.length).to.equal(1);

      expect(toggleExpandQueryOptionsSpy).to.not.have.been.called;
      userEvent.click(expandButton);

      expect(toggleExpandQueryOptionsSpy).to.have.been.calledOnce;
    });

    it('renders the query history button', function () {
      const queryHistoryButton = screen.queryByTestId(queryHistoryButtonId);
      expect(queryHistoryButton).to.be.visible;
    });

    it('does not render the query history popover', function () {
      const queryHistory = screen.queryByTestId(queryHistoryComponentTestId);
      expect(queryHistory).to.not.exist;
    });
  });

  describe('when expanded', function () {
    beforeEach(function () {
      renderQueryBar({
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
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
        queryOptionsLayout: ['project'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
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
        queryOptionsLayout: ['project', 'sort'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
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
        exportToLanguageButtonId
      );
      expect(exportToLanguageButton).to.not.exist;
    });
  });

  describe('when showQueryHistoryButton is false', function () {
    beforeEach(function () {
      renderQueryBar({
        showQueryHistoryButton: false,
      });
    });

    it('does not render the query history button', function () {
      const queryHistoryButton = screen.queryByTestId(queryHistoryButtonId);
      expect(queryHistoryButton).to.not.exist;
    });
  });

  describe('with three query options', function () {
    beforeEach(function () {
      renderQueryBar({
        queryOptionsLayout: ['project', 'sort', 'collation'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
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
        queryOptionsLayout: ['project', 'sort', ['collation', 'limit']],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
        toggleExpandQueryOptions: toggleExpandQueryOptionsSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(5);
    });
  });

  describe('when the query history button is clicked', function () {
    beforeEach(function () {
      renderQueryBar();

      const button = screen.getByTestId(queryHistoryButtonId);
      button.click();
    });

    it('renders the query history popover', function () {
      const queryHistory = screen.getByTestId(queryHistoryComponentTestId);
      expect(queryHistory).to.be.visible;
    });
  });

  describe('tab navigation', function () {
    beforeEach(function () {
      renderQueryBar();
    });

    it('should allow tabbing through the input to the apply button COMPASS-4900', function () {
      const queryHistoryButton = screen.getByTestId(queryHistoryButtonId);
      const applyButton = screen.getByTestId('query-bar-apply-filter-button');

      queryHistoryButton.focus();
      userEvent.tab();
      userEvent.tab();
      userEvent.tab();

      expect(applyButton.ownerDocument.activeElement === applyButton).to.equal(
        true
      );
    });
  });
});
