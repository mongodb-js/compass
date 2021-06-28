// Generated from grammars/ECMAScript.g4 by ANTLR 4.7.2
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete generic visitor for a parse tree produced by ECMAScriptParser.

function ECMAScriptVisitor() {
	antlr4.tree.ParseTreeVisitor.call(this);
	return this;
}

ECMAScriptVisitor.prototype = Object.create(antlr4.tree.ParseTreeVisitor.prototype);
ECMAScriptVisitor.prototype.constructor = ECMAScriptVisitor;

// Visit a parse tree produced by ECMAScriptParser#program.
ECMAScriptVisitor.prototype.visitProgram = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#sourceElements.
ECMAScriptVisitor.prototype.visitSourceElements = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#sourceElement.
ECMAScriptVisitor.prototype.visitSourceElement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#statement.
ECMAScriptVisitor.prototype.visitStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#statementOrBlock.
ECMAScriptVisitor.prototype.visitStatementOrBlock = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#block.
ECMAScriptVisitor.prototype.visitBlock = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#statementList.
ECMAScriptVisitor.prototype.visitStatementList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#variableStatement.
ECMAScriptVisitor.prototype.visitVariableStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#variableDeclarationList.
ECMAScriptVisitor.prototype.visitVariableDeclarationList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#variableDeclaration.
ECMAScriptVisitor.prototype.visitVariableDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#initialiser.
ECMAScriptVisitor.prototype.visitInitialiser = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#emptyStatement.
ECMAScriptVisitor.prototype.visitEmptyStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#expressionStatement.
ECMAScriptVisitor.prototype.visitExpressionStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#ifStatement.
ECMAScriptVisitor.prototype.visitIfStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#DoWhileStatement.
ECMAScriptVisitor.prototype.visitDoWhileStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#WhileStatement.
ECMAScriptVisitor.prototype.visitWhileStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#ForStatement.
ECMAScriptVisitor.prototype.visitForStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#ForVarStatement.
ECMAScriptVisitor.prototype.visitForVarStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#ForInStatement.
ECMAScriptVisitor.prototype.visitForInStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#ForVarInStatement.
ECMAScriptVisitor.prototype.visitForVarInStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#continueStatement.
ECMAScriptVisitor.prototype.visitContinueStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#breakStatement.
ECMAScriptVisitor.prototype.visitBreakStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#returnStatement.
ECMAScriptVisitor.prototype.visitReturnStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#withStatement.
ECMAScriptVisitor.prototype.visitWithStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#switchStatement.
ECMAScriptVisitor.prototype.visitSwitchStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#caseBlock.
ECMAScriptVisitor.prototype.visitCaseBlock = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#caseClauses.
ECMAScriptVisitor.prototype.visitCaseClauses = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#caseClause.
ECMAScriptVisitor.prototype.visitCaseClause = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#defaultClause.
ECMAScriptVisitor.prototype.visitDefaultClause = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#labelledStatement.
ECMAScriptVisitor.prototype.visitLabelledStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#throwStatement.
ECMAScriptVisitor.prototype.visitThrowStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#tryStatement.
ECMAScriptVisitor.prototype.visitTryStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#catchProduction.
ECMAScriptVisitor.prototype.visitCatchProduction = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#finallyProduction.
ECMAScriptVisitor.prototype.visitFinallyProduction = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#debuggerStatement.
ECMAScriptVisitor.prototype.visitDebuggerStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#functionDeclaration.
ECMAScriptVisitor.prototype.visitFunctionDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#formalParameterList.
ECMAScriptVisitor.prototype.visitFormalParameterList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#functionBody.
ECMAScriptVisitor.prototype.visitFunctionBody = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#arrayLiteral.
ECMAScriptVisitor.prototype.visitArrayLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#elementList.
ECMAScriptVisitor.prototype.visitElementList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#elision.
ECMAScriptVisitor.prototype.visitElision = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#objectLiteral.
ECMAScriptVisitor.prototype.visitObjectLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#propertyNameAndValueList.
ECMAScriptVisitor.prototype.visitPropertyNameAndValueList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#PropertyAssignmentExpression.
ECMAScriptVisitor.prototype.visitPropertyAssignmentExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#PropertyGetter.
ECMAScriptVisitor.prototype.visitPropertyGetter = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#PropertySetter.
ECMAScriptVisitor.prototype.visitPropertySetter = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#propertyName.
ECMAScriptVisitor.prototype.visitPropertyName = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#propertySetParameterList.
ECMAScriptVisitor.prototype.visitPropertySetParameterList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#arguments.
ECMAScriptVisitor.prototype.visitArguments = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#argumentList.
ECMAScriptVisitor.prototype.visitArgumentList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#expressionSequence.
ECMAScriptVisitor.prototype.visitExpressionSequence = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#TernaryExpression.
ECMAScriptVisitor.prototype.visitTernaryExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#LogicalAndExpression.
ECMAScriptVisitor.prototype.visitLogicalAndExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#FuncDefExpression.
ECMAScriptVisitor.prototype.visitFuncDefExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#PreIncrementExpression.
ECMAScriptVisitor.prototype.visitPreIncrementExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#ObjectLiteralExpression.
ECMAScriptVisitor.prototype.visitObjectLiteralExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#InExpression.
ECMAScriptVisitor.prototype.visitInExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#LogicalOrExpression.
ECMAScriptVisitor.prototype.visitLogicalOrExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#NotExpression.
ECMAScriptVisitor.prototype.visitNotExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#PreDecreaseExpression.
ECMAScriptVisitor.prototype.visitPreDecreaseExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#ThisExpression.
ECMAScriptVisitor.prototype.visitThisExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#UnaryMinusExpression.
ECMAScriptVisitor.prototype.visitUnaryMinusExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#PostDecreaseExpression.
ECMAScriptVisitor.prototype.visitPostDecreaseExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#AssignmentExpression.
ECMAScriptVisitor.prototype.visitAssignmentExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#TypeofExpression.
ECMAScriptVisitor.prototype.visitTypeofExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#InstanceofExpression.
ECMAScriptVisitor.prototype.visitInstanceofExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#UnaryPlusExpression.
ECMAScriptVisitor.prototype.visitUnaryPlusExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#DeleteExpression.
ECMAScriptVisitor.prototype.visitDeleteExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#EqualityExpression.
ECMAScriptVisitor.prototype.visitEqualityExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#BitXOrExpression.
ECMAScriptVisitor.prototype.visitBitXOrExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#MultiplicativeExpression.
ECMAScriptVisitor.prototype.visitMultiplicativeExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#BitShiftExpression.
ECMAScriptVisitor.prototype.visitBitShiftExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#ParenthesizedExpression.
ECMAScriptVisitor.prototype.visitParenthesizedExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#GetAttributeExpression.
ECMAScriptVisitor.prototype.visitGetAttributeExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#AdditiveExpression.
ECMAScriptVisitor.prototype.visitAdditiveExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#RelationalExpression.
ECMAScriptVisitor.prototype.visitRelationalExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#PostIncrementExpression.
ECMAScriptVisitor.prototype.visitPostIncrementExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#FuncCallExpression.
ECMAScriptVisitor.prototype.visitFuncCallExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#BitNotExpression.
ECMAScriptVisitor.prototype.visitBitNotExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#NewExpression.
ECMAScriptVisitor.prototype.visitNewExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#LiteralExpression.
ECMAScriptVisitor.prototype.visitLiteralExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#ArrayLiteralExpression.
ECMAScriptVisitor.prototype.visitArrayLiteralExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#MemberIndexExpression.
ECMAScriptVisitor.prototype.visitMemberIndexExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#IdentifierExpression.
ECMAScriptVisitor.prototype.visitIdentifierExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#BitAndExpression.
ECMAScriptVisitor.prototype.visitBitAndExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#BitOrExpression.
ECMAScriptVisitor.prototype.visitBitOrExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#AssignmentOperatorExpression.
ECMAScriptVisitor.prototype.visitAssignmentOperatorExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#VoidExpression.
ECMAScriptVisitor.prototype.visitVoidExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#assignmentOperator.
ECMAScriptVisitor.prototype.visitAssignmentOperator = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#NullLiteral.
ECMAScriptVisitor.prototype.visitNullLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#UndefinedLiteral.
ECMAScriptVisitor.prototype.visitUndefinedLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#BooleanLiteral.
ECMAScriptVisitor.prototype.visitBooleanLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#StringLiteral.
ECMAScriptVisitor.prototype.visitStringLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#RegularExpressionLiteral.
ECMAScriptVisitor.prototype.visitRegularExpressionLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#NumericLiteralWrapper.
ECMAScriptVisitor.prototype.visitNumericLiteralWrapper = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#IntegerLiteral.
ECMAScriptVisitor.prototype.visitIntegerLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#DecimalLiteral.
ECMAScriptVisitor.prototype.visitDecimalLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#HexIntegerLiteral.
ECMAScriptVisitor.prototype.visitHexIntegerLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#OctalIntegerLiteral.
ECMAScriptVisitor.prototype.visitOctalIntegerLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#identifierName.
ECMAScriptVisitor.prototype.visitIdentifierName = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#reservedWord.
ECMAScriptVisitor.prototype.visitReservedWord = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#keyword.
ECMAScriptVisitor.prototype.visitKeyword = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#futureReservedWord.
ECMAScriptVisitor.prototype.visitFutureReservedWord = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#getter.
ECMAScriptVisitor.prototype.visitGetter = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#setter.
ECMAScriptVisitor.prototype.visitSetter = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#eos.
ECMAScriptVisitor.prototype.visitEos = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by ECMAScriptParser#eof.
ECMAScriptVisitor.prototype.visitEof = function(ctx) {
  return this.visitChildren(ctx);
};



exports.ECMAScriptVisitor = ECMAScriptVisitor;