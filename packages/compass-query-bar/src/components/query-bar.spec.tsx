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
import type { EditorView } from '@codemirror/view';

async function wait(ms = 50): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitUntilEditorIsReady(
  editorView: EditorView
): Promise<boolean> {
  do {
    await wait();
  } while ((editorView as any).updateState !== 0);

  return true;
}

const noop = () => {
  /* no op */
};

const exportToLanguageButtonId = 'query-bar-open-export-to-language-button';
const queryHistoryButtonId = 'query-history-button';
const queryHistoryComponentTestId = 'query-history';

const getFilterInputEditorView = () => {
  const filterInput = screen.getByTestId(
    'query-bar-option-filter-input'
  ) as any;
  return filterInput._cm as EditorView;
};

const initiateFilterBarWithText = async (text: string) => {
  const editorView = getFilterInputEditorView();
  await waitUntilEditorIsReady(editorView);

  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: text },
  });

  await waitUntilEditorIsReady(editorView);
};

const getFilterInputContent = async () => {
  const editorView = getFilterInputEditorView();
  await waitUntilEditorIsReady(editorView);

  return editorView.state.doc.sliceString(0) ?? '';
};

const getFilterInputEventHandler = () => {
  const editorView = getFilterInputEditorView() as any;
  return editorView.docView.dom as HTMLElement;
};

const clickOnFilterInputContent = () => {
  userEvent.click(getFilterInputEventHandler());
};

async function eventuallyExpectFilterEditorToContain(
  text: string,
  timeout = 5,
  times = 10
) {
  let result = '';

  for (let i = 0; i < times; i++) {
    await waitUntilEditorIsReady(getFilterInputEditorView());

    result = await getFilterInputContent();
    if (result.includes(text)) {
      break;
    }

    await wait(timeout);
  }

  expect(result).to.contain(text);
}

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
        clickOnFilterInputContent();
        await eventuallyExpectFilterEditorToContain('{}');
      });
    });

    describe('non empty state', function () {
      it('does nothing when clicked', async function () {
        const QUERY = '{a: 1}';

        await initiateFilterBarWithText(QUERY);
        clickOnFilterInputContent();
        await eventuallyExpectFilterEditorToContain(QUERY);
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
