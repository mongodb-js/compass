// Generated from grammars/JavaParser.g4 by ANTLR 4.7.1
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete generic visitor for a parse tree produced by JavaParser.

function JavaParserVisitor() {
	antlr4.tree.ParseTreeVisitor.call(this);
	return this;
}

JavaParserVisitor.prototype = Object.create(antlr4.tree.ParseTreeVisitor.prototype);
JavaParserVisitor.prototype.constructor = JavaParserVisitor;

// Visit a parse tree produced by JavaParser#compilationUnit.
JavaParserVisitor.prototype.visitCompilationUnit = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#packageDeclaration.
JavaParserVisitor.prototype.visitPackageDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#importDeclaration.
JavaParserVisitor.prototype.visitImportDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeDeclaration.
JavaParserVisitor.prototype.visitTypeDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#modifier.
JavaParserVisitor.prototype.visitModifier = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#classOrInterfaceModifier.
JavaParserVisitor.prototype.visitClassOrInterfaceModifier = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#variableModifier.
JavaParserVisitor.prototype.visitVariableModifier = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#classDeclaration.
JavaParserVisitor.prototype.visitClassDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeParameters.
JavaParserVisitor.prototype.visitTypeParameters = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeParameter.
JavaParserVisitor.prototype.visitTypeParameter = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeBound.
JavaParserVisitor.prototype.visitTypeBound = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#enumDeclaration.
JavaParserVisitor.prototype.visitEnumDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#enumConstants.
JavaParserVisitor.prototype.visitEnumConstants = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#enumConstant.
JavaParserVisitor.prototype.visitEnumConstant = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#enumBodyDeclarations.
JavaParserVisitor.prototype.visitEnumBodyDeclarations = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#interfaceDeclaration.
JavaParserVisitor.prototype.visitInterfaceDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#classBody.
JavaParserVisitor.prototype.visitClassBody = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#interfaceBody.
JavaParserVisitor.prototype.visitInterfaceBody = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#classBodyDeclaration.
JavaParserVisitor.prototype.visitClassBodyDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#memberDeclaration.
JavaParserVisitor.prototype.visitMemberDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#methodDeclaration.
JavaParserVisitor.prototype.visitMethodDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#methodBody.
JavaParserVisitor.prototype.visitMethodBody = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeTypeOrVoid.
JavaParserVisitor.prototype.visitTypeTypeOrVoid = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#genericMethodDeclaration.
JavaParserVisitor.prototype.visitGenericMethodDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#genericConstructorDeclaration.
JavaParserVisitor.prototype.visitGenericConstructorDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#constructorDeclaration.
JavaParserVisitor.prototype.visitConstructorDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#fieldDeclaration.
JavaParserVisitor.prototype.visitFieldDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#interfaceBodyDeclaration.
JavaParserVisitor.prototype.visitInterfaceBodyDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#interfaceMemberDeclaration.
JavaParserVisitor.prototype.visitInterfaceMemberDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#constDeclaration.
JavaParserVisitor.prototype.visitConstDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#constantDeclarator.
JavaParserVisitor.prototype.visitConstantDeclarator = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#interfaceMethodDeclaration.
JavaParserVisitor.prototype.visitInterfaceMethodDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#interfaceMethodModifier.
JavaParserVisitor.prototype.visitInterfaceMethodModifier = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#genericInterfaceMethodDeclaration.
JavaParserVisitor.prototype.visitGenericInterfaceMethodDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#variableDeclarators.
JavaParserVisitor.prototype.visitVariableDeclarators = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#variableDeclarator.
JavaParserVisitor.prototype.visitVariableDeclarator = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#variableDeclaratorId.
JavaParserVisitor.prototype.visitVariableDeclaratorId = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#variableInitializer.
JavaParserVisitor.prototype.visitVariableInitializer = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#arrayInitializer.
JavaParserVisitor.prototype.visitArrayInitializer = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#classOrInterfaceType.
JavaParserVisitor.prototype.visitClassOrInterfaceType = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeArgument.
JavaParserVisitor.prototype.visitTypeArgument = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#qualifiedNameList.
JavaParserVisitor.prototype.visitQualifiedNameList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#formalParameters.
JavaParserVisitor.prototype.visitFormalParameters = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#formalParameterList.
JavaParserVisitor.prototype.visitFormalParameterList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#formalParameter.
JavaParserVisitor.prototype.visitFormalParameter = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#lastFormalParameter.
JavaParserVisitor.prototype.visitLastFormalParameter = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#qualifiedName.
JavaParserVisitor.prototype.visitQualifiedName = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#literal.
JavaParserVisitor.prototype.visitLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#integerLiteral.
JavaParserVisitor.prototype.visitIntegerLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#floatLiteral.
JavaParserVisitor.prototype.visitFloatLiteral = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#annotation.
JavaParserVisitor.prototype.visitAnnotation = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#elementValuePairs.
JavaParserVisitor.prototype.visitElementValuePairs = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#elementValuePair.
JavaParserVisitor.prototype.visitElementValuePair = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#elementValue.
JavaParserVisitor.prototype.visitElementValue = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#elementValueArrayInitializer.
JavaParserVisitor.prototype.visitElementValueArrayInitializer = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#annotationTypeDeclaration.
JavaParserVisitor.prototype.visitAnnotationTypeDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#annotationTypeBody.
JavaParserVisitor.prototype.visitAnnotationTypeBody = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#annotationTypeElementDeclaration.
JavaParserVisitor.prototype.visitAnnotationTypeElementDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#annotationTypeElementRest.
JavaParserVisitor.prototype.visitAnnotationTypeElementRest = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#annotationMethodOrConstantRest.
JavaParserVisitor.prototype.visitAnnotationMethodOrConstantRest = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#annotationMethodRest.
JavaParserVisitor.prototype.visitAnnotationMethodRest = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#annotationConstantRest.
JavaParserVisitor.prototype.visitAnnotationConstantRest = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#defaultValue.
JavaParserVisitor.prototype.visitDefaultValue = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#block.
JavaParserVisitor.prototype.visitBlock = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#blockStatement.
JavaParserVisitor.prototype.visitBlockStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#localVariableDeclaration.
JavaParserVisitor.prototype.visitLocalVariableDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#localTypeDeclaration.
JavaParserVisitor.prototype.visitLocalTypeDeclaration = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#statement.
JavaParserVisitor.prototype.visitStatement = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#catchClause.
JavaParserVisitor.prototype.visitCatchClause = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#catchType.
JavaParserVisitor.prototype.visitCatchType = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#finallyBlock.
JavaParserVisitor.prototype.visitFinallyBlock = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#resourceSpecification.
JavaParserVisitor.prototype.visitResourceSpecification = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#resources.
JavaParserVisitor.prototype.visitResources = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#resource.
JavaParserVisitor.prototype.visitResource = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#switchBlockStatementGroup.
JavaParserVisitor.prototype.visitSwitchBlockStatementGroup = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#switchLabel.
JavaParserVisitor.prototype.visitSwitchLabel = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#forControl.
JavaParserVisitor.prototype.visitForControl = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#forInit.
JavaParserVisitor.prototype.visitForInit = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#enhancedForControl.
JavaParserVisitor.prototype.visitEnhancedForControl = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#parExpression.
JavaParserVisitor.prototype.visitParExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#expressionList.
JavaParserVisitor.prototype.visitExpressionList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#methodCall.
JavaParserVisitor.prototype.visitMethodCall = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#expression.
JavaParserVisitor.prototype.visitExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#lambdaExpression.
JavaParserVisitor.prototype.visitLambdaExpression = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#lambdaParameters.
JavaParserVisitor.prototype.visitLambdaParameters = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#lambdaBody.
JavaParserVisitor.prototype.visitLambdaBody = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#primary.
JavaParserVisitor.prototype.visitPrimary = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#classType.
JavaParserVisitor.prototype.visitClassType = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#creator.
JavaParserVisitor.prototype.visitCreator = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#createdName.
JavaParserVisitor.prototype.visitCreatedName = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#innerCreator.
JavaParserVisitor.prototype.visitInnerCreator = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#arrayCreatorRest.
JavaParserVisitor.prototype.visitArrayCreatorRest = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#classCreatorRest.
JavaParserVisitor.prototype.visitClassCreatorRest = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#explicitGenericInvocation.
JavaParserVisitor.prototype.visitExplicitGenericInvocation = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeArgumentsOrDiamond.
JavaParserVisitor.prototype.visitTypeArgumentsOrDiamond = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#nonWildcardTypeArgumentsOrDiamond.
JavaParserVisitor.prototype.visitNonWildcardTypeArgumentsOrDiamond = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#nonWildcardTypeArguments.
JavaParserVisitor.prototype.visitNonWildcardTypeArguments = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeList.
JavaParserVisitor.prototype.visitTypeList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeType.
JavaParserVisitor.prototype.visitTypeType = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#primitiveType.
JavaParserVisitor.prototype.visitPrimitiveType = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#typeArguments.
JavaParserVisitor.prototype.visitTypeArguments = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#superSuffix.
JavaParserVisitor.prototype.visitSuperSuffix = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#explicitGenericInvocationSuffix.
JavaParserVisitor.prototype.visitExplicitGenericInvocationSuffix = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by JavaParser#arguments.
JavaParserVisitor.prototype.visitArguments = function(ctx) {
  return this.visitChildren(ctx);
};



exports.JavaParserVisitor = JavaParserVisitor;