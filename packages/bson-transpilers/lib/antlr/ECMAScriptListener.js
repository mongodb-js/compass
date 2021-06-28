// Generated from grammars/ECMAScript.g4 by ANTLR 4.7.2
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete listener for a parse tree produced by ECMAScriptParser.
function ECMAScriptListener() {
	antlr4.tree.ParseTreeListener.call(this);
	return this;
}

ECMAScriptListener.prototype = Object.create(antlr4.tree.ParseTreeListener.prototype);
ECMAScriptListener.prototype.constructor = ECMAScriptListener;

// Enter a parse tree produced by ECMAScriptParser#program.
ECMAScriptListener.prototype.enterProgram = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#program.
ECMAScriptListener.prototype.exitProgram = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#sourceElements.
ECMAScriptListener.prototype.enterSourceElements = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#sourceElements.
ECMAScriptListener.prototype.exitSourceElements = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#sourceElement.
ECMAScriptListener.prototype.enterSourceElement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#sourceElement.
ECMAScriptListener.prototype.exitSourceElement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#statement.
ECMAScriptListener.prototype.enterStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#statement.
ECMAScriptListener.prototype.exitStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#statementOrBlock.
ECMAScriptListener.prototype.enterStatementOrBlock = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#statementOrBlock.
ECMAScriptListener.prototype.exitStatementOrBlock = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#block.
ECMAScriptListener.prototype.enterBlock = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#block.
ECMAScriptListener.prototype.exitBlock = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#statementList.
ECMAScriptListener.prototype.enterStatementList = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#statementList.
ECMAScriptListener.prototype.exitStatementList = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#variableStatement.
ECMAScriptListener.prototype.enterVariableStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#variableStatement.
ECMAScriptListener.prototype.exitVariableStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#variableDeclarationList.
ECMAScriptListener.prototype.enterVariableDeclarationList = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#variableDeclarationList.
ECMAScriptListener.prototype.exitVariableDeclarationList = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#variableDeclaration.
ECMAScriptListener.prototype.enterVariableDeclaration = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#variableDeclaration.
ECMAScriptListener.prototype.exitVariableDeclaration = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#initialiser.
ECMAScriptListener.prototype.enterInitialiser = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#initialiser.
ECMAScriptListener.prototype.exitInitialiser = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#emptyStatement.
ECMAScriptListener.prototype.enterEmptyStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#emptyStatement.
ECMAScriptListener.prototype.exitEmptyStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#expressionStatement.
ECMAScriptListener.prototype.enterExpressionStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#expressionStatement.
ECMAScriptListener.prototype.exitExpressionStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#ifStatement.
ECMAScriptListener.prototype.enterIfStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#ifStatement.
ECMAScriptListener.prototype.exitIfStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#DoWhileStatement.
ECMAScriptListener.prototype.enterDoWhileStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#DoWhileStatement.
ECMAScriptListener.prototype.exitDoWhileStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#WhileStatement.
ECMAScriptListener.prototype.enterWhileStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#WhileStatement.
ECMAScriptListener.prototype.exitWhileStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#ForStatement.
ECMAScriptListener.prototype.enterForStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#ForStatement.
ECMAScriptListener.prototype.exitForStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#ForVarStatement.
ECMAScriptListener.prototype.enterForVarStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#ForVarStatement.
ECMAScriptListener.prototype.exitForVarStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#ForInStatement.
ECMAScriptListener.prototype.enterForInStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#ForInStatement.
ECMAScriptListener.prototype.exitForInStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#ForVarInStatement.
ECMAScriptListener.prototype.enterForVarInStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#ForVarInStatement.
ECMAScriptListener.prototype.exitForVarInStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#continueStatement.
ECMAScriptListener.prototype.enterContinueStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#continueStatement.
ECMAScriptListener.prototype.exitContinueStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#breakStatement.
ECMAScriptListener.prototype.enterBreakStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#breakStatement.
ECMAScriptListener.prototype.exitBreakStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#returnStatement.
ECMAScriptListener.prototype.enterReturnStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#returnStatement.
ECMAScriptListener.prototype.exitReturnStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#withStatement.
ECMAScriptListener.prototype.enterWithStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#withStatement.
ECMAScriptListener.prototype.exitWithStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#switchStatement.
ECMAScriptListener.prototype.enterSwitchStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#switchStatement.
ECMAScriptListener.prototype.exitSwitchStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#caseBlock.
ECMAScriptListener.prototype.enterCaseBlock = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#caseBlock.
ECMAScriptListener.prototype.exitCaseBlock = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#caseClauses.
ECMAScriptListener.prototype.enterCaseClauses = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#caseClauses.
ECMAScriptListener.prototype.exitCaseClauses = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#caseClause.
ECMAScriptListener.prototype.enterCaseClause = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#caseClause.
ECMAScriptListener.prototype.exitCaseClause = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#defaultClause.
ECMAScriptListener.prototype.enterDefaultClause = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#defaultClause.
ECMAScriptListener.prototype.exitDefaultClause = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#labelledStatement.
ECMAScriptListener.prototype.enterLabelledStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#labelledStatement.
ECMAScriptListener.prototype.exitLabelledStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#throwStatement.
ECMAScriptListener.prototype.enterThrowStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#throwStatement.
ECMAScriptListener.prototype.exitThrowStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#tryStatement.
ECMAScriptListener.prototype.enterTryStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#tryStatement.
ECMAScriptListener.prototype.exitTryStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#catchProduction.
ECMAScriptListener.prototype.enterCatchProduction = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#catchProduction.
ECMAScriptListener.prototype.exitCatchProduction = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#finallyProduction.
ECMAScriptListener.prototype.enterFinallyProduction = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#finallyProduction.
ECMAScriptListener.prototype.exitFinallyProduction = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#debuggerStatement.
ECMAScriptListener.prototype.enterDebuggerStatement = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#debuggerStatement.
ECMAScriptListener.prototype.exitDebuggerStatement = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#functionDeclaration.
ECMAScriptListener.prototype.enterFunctionDeclaration = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#functionDeclaration.
ECMAScriptListener.prototype.exitFunctionDeclaration = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#formalParameterList.
ECMAScriptListener.prototype.enterFormalParameterList = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#formalParameterList.
ECMAScriptListener.prototype.exitFormalParameterList = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#functionBody.
ECMAScriptListener.prototype.enterFunctionBody = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#functionBody.
ECMAScriptListener.prototype.exitFunctionBody = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#arrayLiteral.
ECMAScriptListener.prototype.enterArrayLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#arrayLiteral.
ECMAScriptListener.prototype.exitArrayLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#elementList.
ECMAScriptListener.prototype.enterElementList = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#elementList.
ECMAScriptListener.prototype.exitElementList = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#elision.
ECMAScriptListener.prototype.enterElision = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#elision.
ECMAScriptListener.prototype.exitElision = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#objectLiteral.
ECMAScriptListener.prototype.enterObjectLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#objectLiteral.
ECMAScriptListener.prototype.exitObjectLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#propertyNameAndValueList.
ECMAScriptListener.prototype.enterPropertyNameAndValueList = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#propertyNameAndValueList.
ECMAScriptListener.prototype.exitPropertyNameAndValueList = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#PropertyAssignmentExpression.
ECMAScriptListener.prototype.enterPropertyAssignmentExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#PropertyAssignmentExpression.
ECMAScriptListener.prototype.exitPropertyAssignmentExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#PropertyGetter.
ECMAScriptListener.prototype.enterPropertyGetter = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#PropertyGetter.
ECMAScriptListener.prototype.exitPropertyGetter = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#PropertySetter.
ECMAScriptListener.prototype.enterPropertySetter = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#PropertySetter.
ECMAScriptListener.prototype.exitPropertySetter = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#propertyName.
ECMAScriptListener.prototype.enterPropertyName = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#propertyName.
ECMAScriptListener.prototype.exitPropertyName = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#propertySetParameterList.
ECMAScriptListener.prototype.enterPropertySetParameterList = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#propertySetParameterList.
ECMAScriptListener.prototype.exitPropertySetParameterList = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#arguments.
ECMAScriptListener.prototype.enterArguments = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#arguments.
ECMAScriptListener.prototype.exitArguments = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#argumentList.
ECMAScriptListener.prototype.enterArgumentList = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#argumentList.
ECMAScriptListener.prototype.exitArgumentList = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#expressionSequence.
ECMAScriptListener.prototype.enterExpressionSequence = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#expressionSequence.
ECMAScriptListener.prototype.exitExpressionSequence = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#TernaryExpression.
ECMAScriptListener.prototype.enterTernaryExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#TernaryExpression.
ECMAScriptListener.prototype.exitTernaryExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#LogicalAndExpression.
ECMAScriptListener.prototype.enterLogicalAndExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#LogicalAndExpression.
ECMAScriptListener.prototype.exitLogicalAndExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#FuncDefExpression.
ECMAScriptListener.prototype.enterFuncDefExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#FuncDefExpression.
ECMAScriptListener.prototype.exitFuncDefExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#PreIncrementExpression.
ECMAScriptListener.prototype.enterPreIncrementExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#PreIncrementExpression.
ECMAScriptListener.prototype.exitPreIncrementExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#ObjectLiteralExpression.
ECMAScriptListener.prototype.enterObjectLiteralExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#ObjectLiteralExpression.
ECMAScriptListener.prototype.exitObjectLiteralExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#InExpression.
ECMAScriptListener.prototype.enterInExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#InExpression.
ECMAScriptListener.prototype.exitInExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#LogicalOrExpression.
ECMAScriptListener.prototype.enterLogicalOrExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#LogicalOrExpression.
ECMAScriptListener.prototype.exitLogicalOrExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#NotExpression.
ECMAScriptListener.prototype.enterNotExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#NotExpression.
ECMAScriptListener.prototype.exitNotExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#PreDecreaseExpression.
ECMAScriptListener.prototype.enterPreDecreaseExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#PreDecreaseExpression.
ECMAScriptListener.prototype.exitPreDecreaseExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#ThisExpression.
ECMAScriptListener.prototype.enterThisExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#ThisExpression.
ECMAScriptListener.prototype.exitThisExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#UnaryMinusExpression.
ECMAScriptListener.prototype.enterUnaryMinusExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#UnaryMinusExpression.
ECMAScriptListener.prototype.exitUnaryMinusExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#PostDecreaseExpression.
ECMAScriptListener.prototype.enterPostDecreaseExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#PostDecreaseExpression.
ECMAScriptListener.prototype.exitPostDecreaseExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#AssignmentExpression.
ECMAScriptListener.prototype.enterAssignmentExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#AssignmentExpression.
ECMAScriptListener.prototype.exitAssignmentExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#TypeofExpression.
ECMAScriptListener.prototype.enterTypeofExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#TypeofExpression.
ECMAScriptListener.prototype.exitTypeofExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#InstanceofExpression.
ECMAScriptListener.prototype.enterInstanceofExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#InstanceofExpression.
ECMAScriptListener.prototype.exitInstanceofExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#UnaryPlusExpression.
ECMAScriptListener.prototype.enterUnaryPlusExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#UnaryPlusExpression.
ECMAScriptListener.prototype.exitUnaryPlusExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#DeleteExpression.
ECMAScriptListener.prototype.enterDeleteExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#DeleteExpression.
ECMAScriptListener.prototype.exitDeleteExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#EqualityExpression.
ECMAScriptListener.prototype.enterEqualityExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#EqualityExpression.
ECMAScriptListener.prototype.exitEqualityExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#BitXOrExpression.
ECMAScriptListener.prototype.enterBitXOrExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#BitXOrExpression.
ECMAScriptListener.prototype.exitBitXOrExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#MultiplicativeExpression.
ECMAScriptListener.prototype.enterMultiplicativeExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#MultiplicativeExpression.
ECMAScriptListener.prototype.exitMultiplicativeExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#BitShiftExpression.
ECMAScriptListener.prototype.enterBitShiftExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#BitShiftExpression.
ECMAScriptListener.prototype.exitBitShiftExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#ParenthesizedExpression.
ECMAScriptListener.prototype.enterParenthesizedExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#ParenthesizedExpression.
ECMAScriptListener.prototype.exitParenthesizedExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#GetAttributeExpression.
ECMAScriptListener.prototype.enterGetAttributeExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#GetAttributeExpression.
ECMAScriptListener.prototype.exitGetAttributeExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#AdditiveExpression.
ECMAScriptListener.prototype.enterAdditiveExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#AdditiveExpression.
ECMAScriptListener.prototype.exitAdditiveExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#RelationalExpression.
ECMAScriptListener.prototype.enterRelationalExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#RelationalExpression.
ECMAScriptListener.prototype.exitRelationalExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#PostIncrementExpression.
ECMAScriptListener.prototype.enterPostIncrementExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#PostIncrementExpression.
ECMAScriptListener.prototype.exitPostIncrementExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#FuncCallExpression.
ECMAScriptListener.prototype.enterFuncCallExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#FuncCallExpression.
ECMAScriptListener.prototype.exitFuncCallExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#BitNotExpression.
ECMAScriptListener.prototype.enterBitNotExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#BitNotExpression.
ECMAScriptListener.prototype.exitBitNotExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#NewExpression.
ECMAScriptListener.prototype.enterNewExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#NewExpression.
ECMAScriptListener.prototype.exitNewExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#LiteralExpression.
ECMAScriptListener.prototype.enterLiteralExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#LiteralExpression.
ECMAScriptListener.prototype.exitLiteralExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#ArrayLiteralExpression.
ECMAScriptListener.prototype.enterArrayLiteralExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#ArrayLiteralExpression.
ECMAScriptListener.prototype.exitArrayLiteralExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#MemberIndexExpression.
ECMAScriptListener.prototype.enterMemberIndexExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#MemberIndexExpression.
ECMAScriptListener.prototype.exitMemberIndexExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#IdentifierExpression.
ECMAScriptListener.prototype.enterIdentifierExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#IdentifierExpression.
ECMAScriptListener.prototype.exitIdentifierExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#BitAndExpression.
ECMAScriptListener.prototype.enterBitAndExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#BitAndExpression.
ECMAScriptListener.prototype.exitBitAndExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#BitOrExpression.
ECMAScriptListener.prototype.enterBitOrExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#BitOrExpression.
ECMAScriptListener.prototype.exitBitOrExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#AssignmentOperatorExpression.
ECMAScriptListener.prototype.enterAssignmentOperatorExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#AssignmentOperatorExpression.
ECMAScriptListener.prototype.exitAssignmentOperatorExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#VoidExpression.
ECMAScriptListener.prototype.enterVoidExpression = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#VoidExpression.
ECMAScriptListener.prototype.exitVoidExpression = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#assignmentOperator.
ECMAScriptListener.prototype.enterAssignmentOperator = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#assignmentOperator.
ECMAScriptListener.prototype.exitAssignmentOperator = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#NullLiteral.
ECMAScriptListener.prototype.enterNullLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#NullLiteral.
ECMAScriptListener.prototype.exitNullLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#UndefinedLiteral.
ECMAScriptListener.prototype.enterUndefinedLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#UndefinedLiteral.
ECMAScriptListener.prototype.exitUndefinedLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#BooleanLiteral.
ECMAScriptListener.prototype.enterBooleanLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#BooleanLiteral.
ECMAScriptListener.prototype.exitBooleanLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#StringLiteral.
ECMAScriptListener.prototype.enterStringLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#StringLiteral.
ECMAScriptListener.prototype.exitStringLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#RegularExpressionLiteral.
ECMAScriptListener.prototype.enterRegularExpressionLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#RegularExpressionLiteral.
ECMAScriptListener.prototype.exitRegularExpressionLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#NumericLiteralWrapper.
ECMAScriptListener.prototype.enterNumericLiteralWrapper = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#NumericLiteralWrapper.
ECMAScriptListener.prototype.exitNumericLiteralWrapper = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#IntegerLiteral.
ECMAScriptListener.prototype.enterIntegerLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#IntegerLiteral.
ECMAScriptListener.prototype.exitIntegerLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#DecimalLiteral.
ECMAScriptListener.prototype.enterDecimalLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#DecimalLiteral.
ECMAScriptListener.prototype.exitDecimalLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#HexIntegerLiteral.
ECMAScriptListener.prototype.enterHexIntegerLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#HexIntegerLiteral.
ECMAScriptListener.prototype.exitHexIntegerLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#OctalIntegerLiteral.
ECMAScriptListener.prototype.enterOctalIntegerLiteral = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#OctalIntegerLiteral.
ECMAScriptListener.prototype.exitOctalIntegerLiteral = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#identifierName.
ECMAScriptListener.prototype.enterIdentifierName = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#identifierName.
ECMAScriptListener.prototype.exitIdentifierName = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#reservedWord.
ECMAScriptListener.prototype.enterReservedWord = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#reservedWord.
ECMAScriptListener.prototype.exitReservedWord = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#keyword.
ECMAScriptListener.prototype.enterKeyword = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#keyword.
ECMAScriptListener.prototype.exitKeyword = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#futureReservedWord.
ECMAScriptListener.prototype.enterFutureReservedWord = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#futureReservedWord.
ECMAScriptListener.prototype.exitFutureReservedWord = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#getter.
ECMAScriptListener.prototype.enterGetter = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#getter.
ECMAScriptListener.prototype.exitGetter = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#setter.
ECMAScriptListener.prototype.enterSetter = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#setter.
ECMAScriptListener.prototype.exitSetter = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#eos.
ECMAScriptListener.prototype.enterEos = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#eos.
ECMAScriptListener.prototype.exitEos = function(ctx) {
};


// Enter a parse tree produced by ECMAScriptParser#eof.
ECMAScriptListener.prototype.enterEof = function(ctx) {
};

// Exit a parse tree produced by ECMAScriptParser#eof.
ECMAScriptListener.prototype.exitEof = function(ctx) {
};



exports.ECMAScriptListener = ECMAScriptListener;