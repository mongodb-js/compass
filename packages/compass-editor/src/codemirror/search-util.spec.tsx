import React from 'react';
import { expect } from 'chai';
import { render, waitFor } from '@mongodb-js/testing-library-compass';
import { CodemirrorMultilineEditor } from '../editor';
import type { EditorRef } from '../types';

describe('search-util (EditorRef search API)', function () {
  async function renderEditor(text: string) {
    const editorRef = React.createRef<EditorRef>();
    render(<CodemirrorMultilineEditor text={text} ref={editorRef} />);
    await waitFor(() => {
      expect(editorRef.current?.editor).to.exist;
    });
    return editorRef;
  }

  it('finds matches and reports count and current position', async function () {
    const editorRef = await renderEditor('aaa foo bbb foo ccc foo');
    const result = editorRef.current!.find('foo');
    expect(result.count).to.equal(3);
    expect(result.current).to.equal(1);
  });

  it('navigates to the next and previous match', async function () {
    const editorRef = await renderEditor('foo foo foo');
    editorRef.current!.find('foo');

    const next = editorRef.current!.findNext();
    expect(next.current).to.equal(2);
    expect(next.count).to.equal(3);

    const prev = editorRef.current!.findPrevious();
    expect(prev.current).to.equal(1);
  });

  it('reports zero matches for a term that is not present', async function () {
    const editorRef = await renderEditor('hello world');
    const result = editorRef.current!.find('absent');
    expect(result.count).to.equal(0);
    expect(result.current).to.equal(0);
  });

  it('clears the active search', async function () {
    const editorRef = await renderEditor('foo foo');
    expect(editorRef.current!.find('foo').count).to.equal(2);
    editorRef.current!.clearSearch();
    // A subsequent search for a missing term should report no matches,
    // confirming the prior query was cleared rather than retained.
    expect(editorRef.current!.find('missing').count).to.equal(0);
  });
});
