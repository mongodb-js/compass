import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import type { EditorView } from './json-editor';
import { CodemirrorInlineEditor } from './json-editor';
import { expect } from 'chai';
import { createEvent } from '@testing-library/dom';

const wait = async (ms = 10) =>
  await new Promise((resolve) => setTimeout(resolve, ms));

const noop = () => {
  /* no op */
};

const ROOT_TEST_ID = 'editor_id_test';

const renderEditor = (
  { initialText }: { initialText: string },
  { ...props }: Partial<ComponentProps<typeof CodemirrorInlineEditor>> = {}
) => {
  render(
    <CodemirrorInlineEditor
      id="sample-id"
      text={initialText}
      onChangeText={noop}
      placeholder={''}
      completer={() => {
        return null;
      }}
      commands={[]}
      data-testid={ROOT_TEST_ID}
      {...props}
    />
  );
};

const getEditor = () => screen.getByTestId(ROOT_TEST_ID);
const getEditorView = () => (getEditor() as any)._cm as EditorView;
const getEditorTextContents = () => getEditorView().state.sliceDoc().trim();
const getEditorShortcutReceiver = () => {
  const viewEditorDom = getEditorView() as any;
  const shortcutReceiver = viewEditorDom.docView.dom as HTMLElement;
  return shortcutReceiver;
};
const doPutCursorAtTheEnd = () =>
  getEditorView().dispatch({
    selection: {
      anchor: getEditorView().state.doc.length,
      head: getEditorView().state.doc.length,
    },
  });
const doSelectAll = () =>
  getEditorView().dispatch({
    selection: { anchor: 0, head: getEditorView().state.doc.length },
  });
const fireClipboardPasteEvent = (content: string) => {
  const shortcutReceiver = getEditorShortcutReceiver();
  const clipboardEvent = createEvent('paste', shortcutReceiver, {
    bubbles: false,
    cancellable: true,
    composed: true,
  });

  clipboardEvent['clipboardData'] = {
    getData: () => content,
  };

  fireEvent(shortcutReceiver, clipboardEvent);
};
const waitUntilEditorIsIdle = async () => {
  const editorView = getEditorView() as any;
  do {
    await wait();
  } while (editorView.updateState !== 0);
};

describe.only('CodemirrorInlineEditor Component', function () {
  afterEach(function () {
    cleanup();
  });

  describe('focus', function () {
    describe('on empty state', function () {
      beforeEach(function () {
        renderEditor({ initialText: '' });
      });

      it('adds braces', async function () {
        getEditorView().focus();

        await waitUntilEditorIsIdle();
        expect(getEditorTextContents()).to.contain('{}');
      });
    });

    describe('with contents', function () {
      const SOME_QUERY = '{ some query }';

      beforeEach(function () {
        renderEditor({ initialText: SOME_QUERY });
      });

      it('does nothing', async function () {
        const editorView = getEditorView();
        editorView.focus();

        await waitUntilEditorIsIdle();
        expect(getEditorTextContents()).to.contain(SOME_QUERY);
      });
    });
  });

  describe('pasting', function () {
    describe('on empty state', function () {
      beforeEach(function () {
        renderEditor({ initialText: '' });
      });

      it('fixes queries without braces', async function () {
        const VALID_QUERY = '{ "a": 1 }';

        const editorView = getEditorView();
        editorView.focus();
        await waitUntilEditorIsIdle();

        fireClipboardPasteEvent(VALID_QUERY);
        await waitUntilEditorIsIdle();
        expect(getEditorTextContents()).to.contain(VALID_QUERY);
      });
    });

    describe('with contents and without selection', function () {
      beforeEach(function () {
        renderEditor({ initialText: '{ "a": ' });
      });

      it('does not do any additional logic', async function () {
        const editorView = getEditorView();
        editorView.focus();

        doPutCursorAtTheEnd();
        await waitUntilEditorIsIdle();
        fireClipboardPasteEvent('1 ]');

        await waitUntilEditorIsIdle();
        expect(getEditorTextContents()).to.contain('{ "a": 1 ]');
      });
    });

    describe('with contents and selecting all contents', function () {
      beforeEach(function () {
        renderEditor({ initialText: '{ "a": ' });
      });

      it.only('does fix an invalid query that misses the braces', async function () {
        const INVALID_QUERY = 'a: 1';
        const editorView = getEditorView();
        editorView.focus();

        doSelectAll();
        await waitUntilEditorIsIdle();

        fireClipboardPasteEvent(INVALID_QUERY);

        await waitUntilEditorIsIdle();
        expect(getEditorTextContents()).to.contain(`${INVALID_QUERY}`);
      });
    });
  });
});
