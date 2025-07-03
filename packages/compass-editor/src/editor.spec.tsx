import React from 'react';
import { render, userEvent } from '@mongodb-js/testing-library-compass';
import { CodemirrorInlineEditor } from './editor';
import type { EditorRef } from './types';
import { expect } from 'chai';

function renderCodemirrorInlineEditor(text: string) {
  const editorRef = React.createRef<EditorRef>();
  render(<CodemirrorInlineEditor text={text} ref={editorRef} />);
  return editorRef;
}

describe('Editor', function () {
  context('CodemirrorInlineEditor', function () {
    let editorRef: React.RefObject<EditorRef>;
    beforeEach(function () {
      editorRef = renderCodemirrorInlineEditor('{}');

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

      // 2 new line characters as it it allows for new content to be added
      // between the opening and closing braces. and it also correctly
      // indents the cursor position with (2) spaces.
      expect(editorRef.current?.editorContents).to.equal('{\n  \n}');
    });

    it('renders multi lines on {shift}+{enter}', function () {
      userEvent.keyboard('{arrowright}');
      userEvent.keyboard('{shift}{enter}');

      const lines = document.querySelectorAll('.cm-line');
      expect(lines.length).to.equal(3);
      expect(lines[0].textContent).to.equal('{');
      expect(lines[1].textContent?.trim()).to.equal('');
      expect(lines[2].textContent).to.equal('}');

      expect(editorRef.current?.editorContents).to.equal('{\n  \n}');
    });
  });
});
