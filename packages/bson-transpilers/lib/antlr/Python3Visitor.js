// Generated from grammars/Python3.g4 by ANTLR 4.7.2
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete generic visitor for a parse tree produced by Python3Parser.

function Python3Visitor() {
	antlr4.tree.ParseTreeVisitor.call(this);
	return this;
}

Python3Visitor.prototype = Object.create(antlr4.tree.ParseTreeVisitor.prototype);
Python3Visitor.prototype.constructor = Python3Visitor;

// Visit a parse tree produced by Python3Parser#single_input.
Python3Visitor.prototype.visitSingle_input = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#file_input.
Python3Visitor.prototype.visitFile_input = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#eval_input.
Python3Visitor.prototype.visitEval_input = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#decorator.
Python3Visitor.prototype.visitDecorator = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#decorators.
Python3Visitor.prototype.visitDecorators = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#decorated.
Python3Visitor.prototype.visitDecorated = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#async_funcdef.
Python3Visitor.prototype.visitAsync_funcdef = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#funcdef.
Python3Visitor.prototype.visitFuncdef = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#parameters.
Python3Visitor.prototype.visitParameters = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#typedargslist.
Python3Visitor.prototype.visitTypedargslist = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#tfpdef.
Python3Visitor.prototype.visitTfpdef = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#varargslist.
Python3Visitor.prototype.visitVarargslist = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#vfpdef.
Python3Visitor.prototype.visitVfpdef = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#stmt.
Python3Visitor.prototype.visitStmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#simple_stmt.
Python3Visitor.prototype.visitSimple_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#small_stmt.
Python3Visitor.prototype.visitSmall_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#expr_stmt.
Python3Visitor.prototype.visitExpr_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#assign_stmt.
Python3Visitor.prototype.visitAssign_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#annassign.
Python3Visitor.prototype.visitAnnassign = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#testlist_star_expr.
Python3Visitor.prototype.visitTestlist_star_expr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#augassign.
Python3Visitor.prototype.visitAugassign = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#del_stmt.
Python3Visitor.prototype.visitDel_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#pass_stmt.
Python3Visitor.prototype.visitPass_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#flow_stmt.
Python3Visitor.prototype.visitFlow_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#break_stmt.
Python3Visitor.prototype.visitBreak_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#continue_stmt.
Python3Visitor.prototype.visitContinue_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#return_stmt.
Python3Visitor.prototype.visitReturn_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#yield_stmt.
Python3Visitor.prototype.visitYield_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#raise_stmt.
Python3Visitor.prototype.visitRaise_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#import_stmt.
Python3Visitor.prototype.visitImport_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#import_name.
Python3Visitor.prototype.visitImport_name = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#import_from.
Python3Visitor.prototype.visitImport_from = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#import_as_name.
Python3Visitor.prototype.visitImport_as_name = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#dotted_as_name.
Python3Visitor.prototype.visitDotted_as_name = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#import_as_names.
Python3Visitor.prototype.visitImport_as_names = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#dotted_as_names.
Python3Visitor.prototype.visitDotted_as_names = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#dotted_name.
Python3Visitor.prototype.visitDotted_name = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#global_stmt.
Python3Visitor.prototype.visitGlobal_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#nonlocal_stmt.
Python3Visitor.prototype.visitNonlocal_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#assert_stmt.
Python3Visitor.prototype.visitAssert_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#compound_stmt.
Python3Visitor.prototype.visitCompound_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#async_stmt.
Python3Visitor.prototype.visitAsync_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#if_stmt.
Python3Visitor.prototype.visitIf_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#while_stmt.
Python3Visitor.prototype.visitWhile_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#for_stmt.
Python3Visitor.prototype.visitFor_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#try_stmt.
Python3Visitor.prototype.visitTry_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#with_stmt.
Python3Visitor.prototype.visitWith_stmt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#with_item.
Python3Visitor.prototype.visitWith_item = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#except_clause.
Python3Visitor.prototype.visitExcept_clause = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#suite.
Python3Visitor.prototype.visitSuite = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#test.
Python3Visitor.prototype.visitTest = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#inline_if.
Python3Visitor.prototype.visitInline_if = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#test_nocond.
Python3Visitor.prototype.visitTest_nocond = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#lambdef.
Python3Visitor.prototype.visitLambdef = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#lambdef_nocond.
Python3Visitor.prototype.visitLambdef_nocond = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#or_test.
Python3Visitor.prototype.visitOr_test = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#and_test.
Python3Visitor.prototype.visitAnd_test = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#not_test.
Python3Visitor.prototype.visitNot_test = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#comparison.
Python3Visitor.prototype.visitComparison = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#comp_op.
Python3Visitor.prototype.visitComp_op = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#star_expr.
Python3Visitor.prototype.visitStar_expr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#expr.
Python3Visitor.prototype.visitExpr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#xor_expr.
Python3Visitor.prototype.visitXor_expr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#and_expr.
Python3Visitor.prototype.visitAnd_expr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#shift_expr.
Python3Visitor.prototype.visitShift_expr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#arith_expr.
Python3Visitor.prototype.visitArith_expr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#term.
Python3Visitor.prototype.visitTerm = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#factor.
Python3Visitor.prototype.visitFactor = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#power.
Python3Visitor.prototype.visitPower = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#ObjectAtom.
Python3Visitor.prototype.visitObjectAtom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#ArrayAtom.
Python3Visitor.prototype.visitArrayAtom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#EllipsesAtom.
Python3Visitor.prototype.visitEllipsesAtom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#SetAtom.
Python3Visitor.prototype.visitSetAtom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#NumberAtom.
Python3Visitor.prototype.visitNumberAtom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#StringAtom.
Python3Visitor.prototype.visitStringAtom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#IndexAccess.
Python3Visitor.prototype.visitIndexAccess = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#NoneAtom.
Python3Visitor.prototype.visitNoneAtom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#BooleanAtom.
Python3Visitor.prototype.visitBooleanAtom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#FunctionCall.
Python3Visitor.prototype.visitFunctionCall = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#AttributeAccess.
Python3Visitor.prototype.visitAttributeAccess = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#IdentifierAtom.
Python3Visitor.prototype.visitIdentifierAtom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#testlist_comp.
Python3Visitor.prototype.visitTestlist_comp = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#array_literal.
Python3Visitor.prototype.visitArray_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#object_literal.
Python3Visitor.prototype.visitObject_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#set_literal.
Python3Visitor.prototype.visitSet_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#paren_trailer.
Python3Visitor.prototype.visitParen_trailer = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#bracket_trailer.
Python3Visitor.prototype.visitBracket_trailer = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#dot_trailer.
Python3Visitor.prototype.visitDot_trailer = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#subscriptlist.
Python3Visitor.prototype.visitSubscriptlist = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#subscript.
Python3Visitor.prototype.visitSubscript = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#sliceop.
Python3Visitor.prototype.visitSliceop = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#exprlist.
Python3Visitor.prototype.visitExprlist = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#testlist.
Python3Visitor.prototype.visitTestlist = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#dictorsetmaker.
Python3Visitor.prototype.visitDictorsetmaker = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#classdef.
Python3Visitor.prototype.visitClassdef = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#arglist.
Python3Visitor.prototype.visitArglist = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#argument.
Python3Visitor.prototype.visitArgument = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#comp_iter.
Python3Visitor.prototype.visitComp_iter = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#comp_for.
Python3Visitor.prototype.visitComp_for = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#comp_if.
Python3Visitor.prototype.visitComp_if = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#encoding_decl.
Python3Visitor.prototype.visitEncoding_decl = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#yield_expr.
Python3Visitor.prototype.visitYield_expr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#yield_arg.
Python3Visitor.prototype.visitYield_arg = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#string_literal.
Python3Visitor.prototype.visitString_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#IntegerLiteral.
Python3Visitor.prototype.visitIntegerLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#OctLiteral.
Python3Visitor.prototype.visitOctLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#HexLiteral.
Python3Visitor.prototype.visitHexLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#BinLiteral.
Python3Visitor.prototype.visitBinLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#FloatLiteral.
Python3Visitor.prototype.visitFloatLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#ImagLiteral.
Python3Visitor.prototype.visitImagLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#integer_literal.
Python3Visitor.prototype.visitInteger_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#oct_literal.
Python3Visitor.prototype.visitOct_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#hex_literal.
Python3Visitor.prototype.visitHex_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#bin_literal.
Python3Visitor.prototype.visitBin_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#float_literal.
Python3Visitor.prototype.visitFloat_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#imag_literal.
Python3Visitor.prototype.visitImag_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#boolean_literal.
Python3Visitor.prototype.visitBoolean_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#none_literal.
Python3Visitor.prototype.visitNone_literal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#identifier.
Python3Visitor.prototype.visitIdentifier = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#eof.
Python3Visitor.prototype.visitEof = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by Python3Parser#eos.
Python3Visitor.prototype.visitEos = function(ctx) {
  return this.visitChildren(ctx);
};



exports.Python3Visitor = Python3Visitor;