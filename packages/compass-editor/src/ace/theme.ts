import { palette, spacing } from '@mongodb-js/compass-components';

const mongodbAceThemeCssClass = 'ace-mongodb';

const errorColor = encodeURIComponent(palette.red.base);
const errorColorDarkMode = encodeURIComponent(palette.red.light1);

// To trick vscode into formatting and autocompleting the string
const css = String.raw;

const mongodbAceThemeCssText = css`
  .ace-mongodb {
    --editor-color: ${palette.black};
    --editor-background: ${palette.gray.light3};

    --gutter-color: ${palette.gray.base};
    --gutter-background: ${palette.gray.light3};
    --gutter-active-line-background: ${palette.gray.light2};

    --cursor-color: ${palette.gray.base};

    --print-margin-background: ${palette.gray.light2};

    --indent-guide-from: transparent;
    --indent-guide-to: ${palette.gray.light1};

    --marker-active-line-background: ${palette.gray.light2};
    --marker-focus-active-line-background: ${palette.gray.light2};
    --marker-selection-background: ${palette.blue.light2};
    --marker-step-background: ${palette.yellow.light2};
    --marker-stack-background: ${palette.green.base};
    --marker-bracket-border-color: ${palette.gray.light1};
    --marker-selected-word-background: transparent;

    --keyword-color: ${palette.gray.base};
    --string-color: ${palette.blue.base};
    --string-regexp-color: ${palette.blue.base};
    --boolean-color: ${palette.blue.base};
    --constant-numeric-color: ${palette.blue.base};
    --constant-builtin-color: ${palette.blue.light1};
    --variable-class-color: ${palette.green.dark2};
    --variable-instance-color: ${palette.green.dark2};
    --variable-language-color: ${palette.blue.light1};
    --support-function-color: ${palette.blue.light1};
    --comment-color: ${palette.gray.base};
    --invisible-color: ${palette.gray.light1};

    --autocomplete-color: ${palette.black};
    --autocomplete-background: ${palette.gray.light3};
    --autocomplete-border-color: ${palette.gray.light2};
    --autocompletion-highlight-color: ${palette.green.dark1};
    --autocompletion-marker-active-line-background: ${palette.gray.light2};
  }

  .ace_dark.ace-mongodb {
    --editor-color: ${palette.gray.light3};
    --editor-background: ${palette.gray.dark3};

    --gutter-color: ${palette.gray.light3};
    --gutter-background: ${palette.gray.dark3};
    --gutter-active-line-background: ${palette.gray.dark2};

    --cursor-color: ${palette.green.base};

    --print-margin-background: ${palette.gray.light2};

    --indent-guide-from: transparent;
    --indent-guide-to: ${palette.gray.light1};

    --marker-active-line-background: ${palette.gray.dark2};
    --marker-focus-active-line-background: ${palette.gray.dark2};
    --marker-selection-background: ${palette.gray.dark1};
    --marker-step-background: ${palette.yellow.light2};
    --marker-stack-background: ${palette.green.base};
    --marker-bracket-border-color: ${palette.gray.light1};
    --marker-selected-word-background: transparent;

    --keyword-color: #ff7dc3;
    --string-color: #35de7b;
    --string-regexp-color: #35de7b;
    --boolean-color: #2dc4ff;
    --constant-numeric-color: #ff6f44;
    --constant-builtin-color: ${palette.blue.light1};
    --variable-class-color: #a5e3ff;
    --variable-instance-color: #a5e3ff;
    --variable-language-color: ${palette.blue.light1};
    --support-function-color: ${palette.blue.light1};
    --comment-color: ${palette.gray.base};
    --invisible-color: ${palette.gray.dark2};

    --autocomplete-color: ${palette.gray.light1};
    --autocomplete-background: ${palette.gray.dark3};
    --autocomplete-border-color: ${palette.gray.dark1};
    --autocompletion-highlight-color: ${palette.gray.light3};
    --autocompletion-marker-active-line-background: ${palette.gray.dark2};
  }

  .ace-mongodb.ace_editor {
    color: var(--editor-color);
    background: var(--editor-background);
    line-height: ${spacing[3]}px;
  }
  .inline-editor.ace-mongodb.ace_editor {
    background: transparent;
  }
  .ace-mongodb .ace_placeholder {
    margin: 0;
    font-family: inherit;
    font-size: inherit;
    font-style: inherit !important;
    transform: none;
    opacity: 1;
    /* To match ace editor text padding */
    padding: 0 4px !important;
  }
  .ace-mongodb .ace_gutter {
    color: var(--gutter-color);
    background: var(--gutter-background);
  }
  .inline-editor.ace-mongodb .ace_gutter {
    background: inherit;
  }
  .ace-mongodb .ace_gutter-cell {
    /* gutter left padding has to account for error annotation icon size */
    padding-left: ${spacing[3]}px;
  }
  .ace-mongodb .ace_gutter-cell.ace_error {
    /* leafygreen XWithCircle */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3E%3Cpath fill='${errorColor}' fill-rule='evenodd' d='M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm1.414-9.828a1 1 0 1 1 1.414 1.414L9.414 8l1.414 1.414a1 1 0 1 1-1.414 1.414L8 9.414l-1.414 1.414a1 1 0 1 1-1.414-1.414L6.586 8 5.172 6.586a1 1 0 0 1 1.414-1.414L8 6.586l1.414-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E%0A");
    /* leafygreen small icon size */
    background-size: 12px;
    background-repeat: no-repeat;
    background-position: ${spacing[1] / 2}px center;
  }
  /* To change svg foll color, we have to completely replace the background url, this can't be done with css custom properties */
  .ace_dark.ace-mongodb .ace_gutter-cell.ace_error {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3E%3Cpath fill='${errorColorDarkMode}' fill-rule='evenodd' d='M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm1.414-9.828a1 1 0 1 1 1.414 1.414L9.414 8l1.414 1.414a1 1 0 1 1-1.414 1.414L8 9.414l-1.414 1.414a1 1 0 1 1-1.414-1.414L6.586 8 5.172 6.586a1 1 0 0 1 1.414-1.414L8 6.586l1.414-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E%0A");
  }
  .ace-mongodb .ace_keyword {
    color: var(--keyword-color);
    font-weight: normal;
  }
  .ace-mongodb .ace_string {
    color: var(--string-color);
  }
  .ace-mongodb .ace_boolean {
    color: var(--boolean-color);
    font-weight: normal;
  }
  .ace-mongodb .ace_constant.ace_numeric {
    color: var(--constant-numeric-color);
  }
  .ace-mongodb .ace_string.ace_regexp {
    color: var(--string-regexp-color);
  }
  .ace-mongodb .ace_variable.ace_class {
    color: var(--variable-class-color);
  }
  .ace-mongodb .ace_constant.ace_buildin {
    color: var(--constant-builtin-color);
  }
  .ace-mongodb .ace_support.ace_function {
    color: var(--support-function-color);
  }
  .ace-mongodb .ace_comment {
    color: var(--comment-color);
    font-style: italic;
  }
  .ace-mongodb .ace_variable.ace_language {
    color: var(--variable-language-color);
  }
  .ace-mongodb .ace_paren {
    font-weight: normal;
  }
  .ace-mongodb .ace_variable.ace_instance {
    color: var(--variable-instance-color);
  }
  .ace-mongodb .ace_constant.ace_language {
    font-weight: bold;
  }
  .ace-mongodb .ace_cursor {
    background: transparent;
    color: var(--cursor-color);
    border-color: var(--cursor-color);
  }
  .ace-mongodb .ace_marker-layer .ace_active-line {
    background: var(--marker-active-line-background);
  }
  .ace-mongodb.ace_focus .ace_marker-layer .ace_active-line {
    background: var(--marker-focus-active-line-background);
  }
  .ace-mongodb .ace_marker-layer .ace_selection {
    background: var(--marker-selection-background);
  }
  .ace-mongodb.ace_nobold .ace_line > span {
    font-weight: normal !important;
  }
  .ace-mongodb .ace_marker-layer .ace_step {
    background: var(--marker-step-background);
  }
  .ace-mongodb .ace_marker-layer .ace_stack {
    background: var(--marker-stack-background);
  }
  .ace-mongodb .ace_marker-layer .ace_bracket {
    margin: 0px;
    border: 1px solid var(--marker-bracket-border-color);
  }
  .ace-mongodb .ace_gutter-active-line {
    background: var(--gutter-active-line-background);
  }
  .ace-mongodb .ace_marker-layer .ace_selected-word {
    background: var(--marker-selected-word-background);
    border: none;
  }
  .ace-mongodb .ace_invisible {
    color: var(--invisible-color);
  }
  .ace-mongodb .ace_print-margin {
    width: 1px;
    background: var(--print-margin-background);
  }
  .ace-mongodb .ace_hidden-cursors {
    opacity: 0;
  }
  .ace-mongodb .ace_indent-guide {
    background: linear-gradient(
        to top,
        var(--indent-guide-from) 0%,
        var(--indent-guide-from) 50%,
        var(--indent-guide-to) 50%,
        var(--indent-guide-to) 100%
      )
      right repeat-y;
    background-size: 1px 2px;
  }
  .ace-mongodb .ace_scroller.ace_scroll-left {
    /* Hide ace's default left box shadow when scrolled. */
    box-shadow: none;
  }

  /* Autocomplete colors */

  /* duplicating class names to override default ace styles */
  .ace-mongodb.ace-mongodb.ace_editor.ace_autocomplete {
    box-sizing: border-box;
    border: 1px solid var(--autocomplete-border-color);
    background-color: var(--autocomplete-background);
    box-shadow: 0 5px 8px 0 rgba(0, 0, 0, 0.5);
    color: var(--autocomplete-color);
    /* line-height: 24px; */
  }
  .ace-mongodb.ace-mongodb.ace_editor.ace_autocomplete
    .ace_completion-highlight {
    color: var(--autocompletion-highlight-color);
    text-shadow: none;
    font-weight: bold;
  }
  .ace-mongodb.ace-mongodb.ace_editor.ace_autocomplete
    .ace_marker-layer
    .ace_active-line {
    background-color: var(--autocompletion-marker-active-line-background);
  }
`;

ace.define(
  'ace/theme/mongodb',
  ['require', 'exports', 'module', 'ace/lib/dom'],
  function (acequire, exports) {
    exports.isDark = false;
    exports.cssClass = mongodbAceThemeCssClass;
    exports.cssText = mongodbAceThemeCssText;
    const dom = acequire('../lib/dom');
    dom.importCssString(exports.cssText, exports.cssClass);
  }
);

// The only way to consistently enable setting dark theme class name both on
// editor itself and on autocompleter modal is to have a theme with isDark set
// to true, for that reason and to avoid duplicating the actual theme, we keep
// one source for the theme, but register it as two different themes that we
// switch when editor prop for the dark mode is changed
ace.define(
  'ace/theme/mongodb-dark',
  ['require', 'exports', 'module', 'ace/lib/dom'],
  function (acequire, exports) {
    exports.isDark = true;
    exports.cssClass = mongodbAceThemeCssClass;
    exports.cssText = mongodbAceThemeCssText;
    const dom = acequire('../lib/dom');
    dom.importCssString(exports.cssText, exports.cssClass);
  }
);

// Only for HMR
export { mongodbAceThemeCssClass, mongodbAceThemeCssText };
