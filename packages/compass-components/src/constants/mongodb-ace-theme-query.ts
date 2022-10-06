const mongodbAceThemeQueryCssText = `
.ace-mongodb-query .ace_scroller {
line-height: 14px;
background: none;
}
.ace-mongodb-query .ace_gutter {
background: #ffffff;
color: #889397;
}
.ace-mongodb-query  {
background: #ffffff;
color: #000000;
}
.ace-mongodb-query .ace_placeholder {
font-family: inherit;
transform: none;
opacity: 1;
margin: 0;
padding: 6px 9px !important;
}
.ace-mongodb-query .ace_keyword {
color: #889397;
font-weight: normal;
}
.ace-mongodb-query .ace_gutter-cell {
padding-left: 5px;
padding-right: 10px;
}
.ace-mongodb-query .ace_string {
color: #016bf8;
}
.ace-mongodb-query .ace_boolean {
color: #016bf8;
font-weight: normal;
}
.ace-mongodb-query .ace_constant.ace_numeric {
color: #016bf8;
}
.ace-mongodb-query .ace_string.ace_regexp {
color: #016bf8;
}
.ace-mongodb-query .ace_variable.ace_class {
color: #00684a;
}
.ace-mongodb-query .ace_constant.ace_buildin {
color: #0498ec;
}
.ace-mongodb-query .ace_support.ace_function {
color: #0498ec;
}
.ace-mongodb-query .ace_comment {
color: #889397;
}
.ace-mongodb-query .ace_variable.ace_language  {
color: #0498ec;
}
.ace-mongodb-query .ace_paren {
font-weight: normal;
}
.ace-mongodb-query .ace_variable.ace_instance {
color: #00684a;
}
.ace-mongodb-query .ace_constant.ace_language {
font-weight: bold;
}
.ace-mongodb-query .ace_cursor {
color: #889397;
}
.ace-mongodb-query.ace_focus .ace_marker-layer .ace_active-line {
background: #ffffff;
}
.ace-mongodb-query .ace_marker-layer .ace_active-line {
background: #ffffff;
}
.ace-mongodb-query .ace_marker-layer .ace_selection {
background: #c3e7fe;
}
.ace-mongodb-query.ace_multiselect .ace_selection.ace_start {
box-shadow: 0 0 3px 0px #ffffff;
}
.ace-mongodb-query.ace_nobold .ace_line > span {
font-weight: normal !important;
}
.ace-mongodb-query .ace_marker-layer .ace_step {
background: #ffec9e;
}
.ace-mongodb-query .ace_marker-layer .ace_stack {
background: #00ed64;
}
.ace-mongodb-query .ace_marker-layer .ace_bracket {
margin: -1px 0 0 -1px;
border: 1px solid #c1c7c6;
}
.ace-mongodb-query .ace_gutter-active-line {
background: #ffffff;
}
.ace-mongodb-query .ace_marker-layer .ace_selected-word {
background: #ffffff;
border: 1px solid #f1d4fd;
}
.ace-mongodb-query .ace_invisible {
color: #c1c7c6
}
.ace-mongodb-query .ace_print-margin {
width: 1px;
background: #e8edeb;
}
.ace-mongodb-query .ace_hidden-cursors {
  opacity: 0;
}
.ace-mongodb-query .ace_indent-guide {
  background: linear-gradient(to top, transparent 0%, transparent 50%, #c1c7c6 50%, #c1c7c6 100%) right repeat-y;
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
