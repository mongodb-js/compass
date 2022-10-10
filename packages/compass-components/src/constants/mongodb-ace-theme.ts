import { palette } from '@leafygreen-ui/palette';

const mongodbAceThemeCssText = `
.ace-mongodb .ace_gutter {
background: ${palette.gray.light3};
color: ${palette.gray.base};
}
.ace-mongodb  {
background: ${palette.gray.light3};
color: ${palette.black};
}
.ace-mongodb .ace_keyword {
color: ${palette.gray.base};
font-weight: normal;
}
.ace-mongodb .ace_gutter-cell {
padding-left: 5px;
padding-right: 10px;
}
.ace-mongodb .ace_string {
color: ${palette.blue.base};
}
.ace-mongodb .ace_boolean {
color: ${palette.blue.base};
font-weight: normal;
}
.ace-mongodb .ace_constant.ace_numeric {
color: ${palette.blue.base};
}
.ace-mongodb .ace_string.ace_regexp {
color: ${palette.blue.base};
}
.ace-mongodb .ace_variable.ace_class {
color: ${palette.green.dark2};
}
.ace-mongodb .ace_constant.ace_buildin {
color: ${palette.blue.light1};
}
.ace-mongodb .ace_support.ace_function {
color: ${palette.blue.light1};
}
.ace-mongodb .ace_comment {
color: ${palette.gray.base};
font-style: italic;
}
.ace-mongodb .ace_variable.ace_language  {
color: ${palette.blue.light1};
}
.ace-mongodb .ace_paren {
font-weight: normal;
}
.ace-mongodb .ace_variable.ace_instance {
color: ${palette.green.dark2};
}
.ace-mongodb .ace_constant.ace_language {
font-weight: bold;
}
.ace-mongodb .ace_cursor {
color: ${palette.gray.base};
}
.ace-mongodb.ace_focus .ace_marker-layer .ace_active-line {
background: ${palette.gray.light3};
}
.ace-mongodb .ace_marker-layer .ace_active-line {
background: ${palette.gray.light3};
}
.ace-mongodb .ace_marker-layer .ace_selection {
background: ${palette.blue.light2};
}
.ace-mongodb.ace_multiselect .ace_selection.ace_start {
box-shadow: 0 0 3px 0px ${palette.white};
}
.ace-mongodb.ace_nobold .ace_line > span {
font-weight: normal !important;
}
.ace-mongodb .ace_marker-layer .ace_step {
background: ${palette.yellow.light2};
}
.ace-mongodb .ace_marker-layer .ace_stack {
background: ${palette.green.base};
}
.ace-mongodb .ace_marker-layer .ace_bracket {
margin: -1px 0 0 -1px;
border: 1px solid ${palette.gray.light1};
}
.ace-mongodb .ace_gutter-active-line {
background: ${palette.gray.light3};
}
.ace-mongodb .ace_marker-layer .ace_selected-word {
background: ${palette.white};
border: 1px solid ${palette.purple.light2};
}
.ace-mongodb .ace_invisible {
color: ${palette.gray.light1}
}
.ace-mongodb .ace_print-margin {
width: 1px;
background: ${palette.gray.light2};
}
.ace-mongodb .ace_hidden-cursors {
  opacity: 0;
}
.ace-mongodb .ace_indent-guide {
  background: linear-gradient(to top, transparent 0%, transparent 50%, ${palette.gray.light1} 50%, ${palette.gray.light1} 100%) right repeat-y;
  background-size: 1px 2px;
}`;

function mongodbAceTheme(acequire: any, exports: any) {
  exports.isDark = false;
  exports.cssClass = 'ace-mongodb';
  exports.cssText = mongodbAceThemeCssText;

  const dom = acequire('../lib/dom');
  dom.importCssString(exports.cssText, exports.cssClass);
}

// @ts-expect-error the global ace module is available dynamically.
ace.define(
  'ace/theme/mongodb',
  ['require', 'exports', 'module', 'ace/lib/dom'],
  mongodbAceTheme
);
