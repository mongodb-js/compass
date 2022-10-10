import { palette } from '@leafygreen-ui/palette';

const mongodbAceThemeQueryCssText = `
.ace-mongodb-query .ace_scroller {
line-height: 14px;
background: none;
}
.ace-mongodb-query .ace_gutter {
background: ${palette.white};
color: ${palette.gray.base};
}
.ace-mongodb-query  {
background: ${palette.white};
color: ${palette.black};
}
.ace-mongodb-query .ace_placeholder {
font-family: inherit;
transform: none;
opacity: 1;
margin: 0;
padding: 6px 9px !important;
}
.ace-mongodb-query .ace_keyword {
color: ${palette.gray.base};
font-weight: normal;
}
.ace-mongodb-query .ace_gutter-cell {
padding-left: 5px;
padding-right: 10px;
}
.ace-mongodb-query .ace_string {
color: ${palette.blue.base};
}
.ace-mongodb-query .ace_boolean {
color: ${palette.blue.base};
font-weight: normal;
}
.ace-mongodb-query .ace_constant.ace_numeric {
color: ${palette.blue.base};
}
.ace-mongodb-query .ace_string.ace_regexp {
color: ${palette.blue.base};
}
.ace-mongodb-query .ace_variable.ace_class {
color: ${palette.green.dark2};
}
.ace-mongodb-query .ace_constant.ace_buildin {
color: ${palette.blue.light1};
}
.ace-mongodb-query .ace_support.ace_function {
color: ${palette.blue.light1};
}
.ace-mongodb-query .ace_comment {
color: ${palette.gray.base};
}
.ace-mongodb-query .ace_variable.ace_language  {
color: ${palette.blue.light1};
}
.ace-mongodb-query .ace_paren {
font-weight: normal;
}
.ace-mongodb-query .ace_variable.ace_instance {
color: ${palette.green.dark2};
}
.ace-mongodb-query .ace_constant.ace_language {
font-weight: bold;
}
.ace-mongodb-query .ace_cursor {
color: ${palette.gray.base};
}
.ace-mongodb-query.ace_focus .ace_marker-layer .ace_active-line {
background: ${palette.white};
}
.ace-mongodb-query .ace_marker-layer .ace_active-line {
background: ${palette.white};
}
.ace-mongodb-query .ace_marker-layer .ace_selection {
background: ${palette.blue.light2};
}
.ace-mongodb-query.ace_multiselect .ace_selection.ace_start {
box-shadow: 0 0 3px 0px ${palette.white};
}
.ace-mongodb-query.ace_nobold .ace_line > span {
font-weight: normal !important;
}
.ace-mongodb-query .ace_marker-layer .ace_step {
background: ${palette.yellow.light2};
}
.ace-mongodb-query .ace_marker-layer .ace_stack {
background: ${palette.green.base};
}
.ace-mongodb-query .ace_marker-layer .ace_bracket {
margin: -1px 0 0 -1px;
border: 1px solid ${palette.gray.light1};
}
.ace-mongodb-query .ace_gutter-active-line {
background: ${palette.white};
}
.ace-mongodb-query .ace_marker-layer .ace_selected-word {
background: ${palette.white};
border: 1px solid ${palette.purple.light2};
}
.ace-mongodb-query .ace_invisible {
color: ${palette.gray.light1}
}
.ace-mongodb-query .ace_print-margin {
width: 1px;
background: ${palette.gray.light2};
}
.ace-mongodb-query .ace_hidden-cursors {
  opacity: 0;
}
.ace-mongodb-query .ace_indent-guide {
  background: linear-gradient(to top, transparent 0%, transparent 50%, ${palette.gray.light1} 50%, ${palette.gray.light1} 100%) right repeat-y;
  background-size: 1px 2px;
}`;

function mongodbAceThemeQuery(acequire: any, exports: any) {
  exports.isDark = false;
  exports.cssClass = 'ace-mongodb-query';
  exports.cssText = mongodbAceThemeQueryCssText;
  const dom = acequire('../lib/dom');
  dom.importCssString(exports.cssText, exports.cssClass);
}

// @ts-expect-error the global ace module is available dynamically.
ace.define(
  'ace/theme/mongodb-query',
  ['require', 'exports', 'module', 'ace/lib/dom'],
  mongodbAceThemeQuery
);
