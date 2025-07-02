import React from 'react';
import { render, userEvent } from '@mongodb-js/testing-library-compass';
import { CodemirrorInlineEditor } from './editor';
import type { EditorRef } from './types';
import { expect } from 'chai';

function renderEditor(text: string) {
  const editorRef = React.createRef<EditorRef>();
  render(<CodemirrorInlineEditor text={text} ref={editorRef} />);
  return editorRef;
}

describe('Editor', function () {
  context('CodemirrorInlineEditor', function () {
    let editorRef: React.RefObject<EditorRef>;
    beforeEach(function () {
      editorRef = renderEditor('{}');

      const lines = document.querySelectorAll('.cm-line');
      expect(lines.length).to.equal(1);
      expect(lines[0].textContent).to.equal('{}');
      editorRef.current?.focus();
    });

    it('renders multi lines on {enter}', function () {
      userEvent.keyboard('{arrowright}');
      userEvent.keyboard('{enter}');

      const lines = document.querySelectorAll('.cm-line');
      // On enter, the editor is split into three lines:
      // 1. The opening brace
      // 2. An empty line - to allow for new content
      // 3. The closing brace
      expect(lines.length).to.equal(3);
      expect(lines[0].textContent).to.equal('{');
      expect(lines[1].textContent?.trim()).to.equal('');
      expect(lines[2].textContent).to.equal('}');
    });

    it('renders multi lines on {shift}+{enter}', function () {
      userEvent.keyboard('{arrowright}');
      userEvent.keyboard('{shift}{enter}');

      const lines = document.querySelectorAll('.cm-line');
      expect(lines.length).to.equal(3);
      expect(lines[0].textContent).to.equal('{');
      expect(lines[1].textContent?.trim()).to.equal('');
      expect(lines[2].textContent).to.equal('}');
    });
  });
});
