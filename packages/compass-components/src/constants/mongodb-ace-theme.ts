const mongodbAceThemeCssText = `
.ace-mongodb .ace_gutter {
background: #f5f6f7;
color: #999999;
}
.ace-mongodb  {
background: #f5f6f7;
color: #000;
}
.ace-mongodb .ace_keyword {
color: #999999;
font-weight: normal;
}
.ace-mongodb .ace_gutter-cell {
padding-left: 5px;
padding-right: 10px;
}
.ace-mongodb .ace_string {
color: #5b81a9;
}
.ace-mongodb .ace_boolean {
color: #5b81a9;
font-weight: normal;
}
.ace-mongodb .ace_constant.ace_numeric {
color: #5b81a9;
}
.ace-mongodb .ace_string.ace_regexp {
color: #5b81a9;
}
.ace-mongodb .ace_variable.ace_class {
color: #008080;
}
.ace-mongodb .ace_constant.ace_buildin {
color: #0086B3;
}
.ace-mongodb .ace_support.ace_function {
color: #0086B3;
}
.ace-mongodb .ace_comment {
color: #999988;
font-style: italic;
}
.ace-mongodb .ace_variable.ace_language  {
color: #0086B3;
}
.ace-mongodb .ace_paren {
font-weight: normal;
}
.ace-mongodb .ace_variable.ace_instance {
color: #008080;
}
.ace-mongodb .ace_constant.ace_language {
font-weight: bold;
}
.ace-mongodb .ace_cursor {
color: #999999;
}
.ace-mongodb.ace_focus .ace_marker-layer .ace_active-line {
background: #f5f6f7;
}
.ace-mongodb .ace_marker-layer .ace_active-line {
background: #f5f5f5;
}
.ace-mongodb .ace_marker-layer .ace_selection {
background: #b5d5ff;
}
.ace-mongodb.ace_multiselect .ace_selection.ace_start {
box-shadow: 0 0 3px 0px #ffffff;
}
.ace-mongodb.ace_nobold .ace_line > span {
font-weight: normal !important;
}
.ace-mongodb .ace_marker-layer .ace_step {
background: #fcff00;
}
.ace-mongodb .ace_marker-layer .ace_stack {
background: #a4e565;
}
.ace-mongodb .ace_marker-layer .ace_bracket {
margin: -1px 0 0 -1px;
border: 1px solid #c0c0c0;
}
.ace-mongodb .ace_gutter-active-line {
background: #f5f6f7;
}
.ace-mongodb .ace_marker-layer .ace_selected-word {
background: #fafaff;
border: 1px solid #c8c8fa;
}
.ace-mongodb .ace_invisible {
color: #BFBFBF
}
.ace-mongodb .ace_print-margin {
width: 1px;
background: #e8e8e8;
}
.ace-mongodb .ace_hidden-cursors {
  opacity: 0;
}
.ace-mongodb .ace_indent-guide {
  background: linear-gradient(to top, transparent 0%, transparent 50%, #bfbfbf 50%, #bfbfbf 100%) right repeat-y;
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
