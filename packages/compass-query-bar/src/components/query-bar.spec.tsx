import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import QueryBar from './query-bar';
import { Provider } from 'react-redux';
import { configureStore } from '../stores/query-bar-store';
import { toggleQueryOptions } from '../stores/query-bar-reducer';
import {
  setCodemirrorEditorValue,
  getCodemirrorEditorValue,
  clickOnCodemirrorHandler,
} from '@mongodb-js/compass-editor';

const noop = () => {
  /* no op */
};

const exportToLanguageButtonId = 'query-bar-open-export-to-language-button';
const queryHistoryButtonId = 'query-history-button';
const queryHistoryComponentTestId = 'query-history';

const renderQueryBar = ({
  expanded = false,
  ...props
}: Partial<ComponentProps<typeof QueryBar>> & { expanded?: boolean } = {}) => {
  const store = configureStore();
  store.dispatch(toggleQueryOptions(expanded));

  render(
    <Provider store={store}>
      <QueryBar
        buttonLabel="Apply"
        onApply={noop}
        onReset={noop}
        showExportToLanguageButton
        showQueryHistoryButton
        resultId="123"
        {...props}
      />
    </Provider>
  );
};

describe('QueryBar Component', function () {
  let onApplySpy: SinonSpy;
  let onResetSpy: SinonSpy;

  beforeEach(function () {
    onApplySpy = sinon.spy();
    onResetSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('when rendered', function () {
    beforeEach(function () {
      renderQueryBar({
        onApply: onApplySpy,
        onReset: onResetSpy,
        showExportToLanguageButton: true,
      });
    });

    describe('empty state', function () {
      it('fills the filter input when clicked with an empty object "{}"', async function () {
        const filterInput = await screen.findByTestId(
          'query-bar-option-filter-input'
        );

        await clickOnCodemirrorHandler(filterInput);
        const editorValue = await getCodemirrorEditorValue(filterInput);
        expect(editorValue).to.equal('{}');
      });
    });

    describe('non empty state', function () {
      it('does nothing when clicked', async function () {
        const query = '{a: 1}';
        const filterInput = await screen.findByTestId(
          'query-bar-option-filter-input'
        );

        await setCodemirrorEditorValue(filterInput, query);
        await clickOnCodemirrorHandler(filterInput);
        const editorValue = await getCodemirrorEditorValue(filterInput);
        expect(editorValue).to.equal(query);
      });
    });

    it('renders the filter input', function () {
      const filterInput = screen.getByTestId('query-bar-option-filter-input');
      expect(filterInput).to.exist;
      expect(filterInput).to.have.attribute(
        'id',
        'query-bar-option-input-filter'
      );

      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(1);
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

    it('should not allow tabbing through the input to the apply button', function () {
      const queryHistoryButton = screen.getByTestId(queryHistoryButtonId);
      const applyButton = screen.getByTestId('query-bar-apply-filter-button');

      queryHistoryButton.focus();
      userEvent.tab();
      userEvent.tab();
      userEvent.tab();

      expect(
        applyButton.ownerDocument.activeElement === screen.getByRole('textbox')
      ).to.equal(true);
    });
  });
});
