// Generated from grammars/JavaParser.g4 by ANTLR 4.7.1
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete listener for a parse tree produced by JavaParser.
function JavaParserListener() {
	antlr4.tree.ParseTreeListener.call(this);
	return this;
}

JavaParserListener.prototype = Object.create(antlr4.tree.ParseTreeListener.prototype);
JavaParserListener.prototype.constructor = JavaParserListener;

// Enter a parse tree produced by JavaParser#compilationUnit.
JavaParserListener.prototype.enterCompilationUnit = function(ctx) {
};

// Exit a parse tree produced by JavaParser#compilationUnit.
JavaParserListener.prototype.exitCompilationUnit = function(ctx) {
};


// Enter a parse tree produced by JavaParser#packageDeclaration.
JavaParserListener.prototype.enterPackageDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#packageDeclaration.
JavaParserListener.prototype.exitPackageDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#importDeclaration.
JavaParserListener.prototype.enterImportDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#importDeclaration.
JavaParserListener.prototype.exitImportDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeDeclaration.
JavaParserListener.prototype.enterTypeDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeDeclaration.
JavaParserListener.prototype.exitTypeDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#modifier.
JavaParserListener.prototype.enterModifier = function(ctx) {
};

// Exit a parse tree produced by JavaParser#modifier.
JavaParserListener.prototype.exitModifier = function(ctx) {
};


// Enter a parse tree produced by JavaParser#classOrInterfaceModifier.
JavaParserListener.prototype.enterClassOrInterfaceModifier = function(ctx) {
};

// Exit a parse tree produced by JavaParser#classOrInterfaceModifier.
JavaParserListener.prototype.exitClassOrInterfaceModifier = function(ctx) {
};


// Enter a parse tree produced by JavaParser#variableModifier.
JavaParserListener.prototype.enterVariableModifier = function(ctx) {
};

// Exit a parse tree produced by JavaParser#variableModifier.
JavaParserListener.prototype.exitVariableModifier = function(ctx) {
};


// Enter a parse tree produced by JavaParser#classDeclaration.
JavaParserListener.prototype.enterClassDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#classDeclaration.
JavaParserListener.prototype.exitClassDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeParameters.
JavaParserListener.prototype.enterTypeParameters = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeParameters.
JavaParserListener.prototype.exitTypeParameters = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeParameter.
JavaParserListener.prototype.enterTypeParameter = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeParameter.
JavaParserListener.prototype.exitTypeParameter = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeBound.
JavaParserListener.prototype.enterTypeBound = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeBound.
JavaParserListener.prototype.exitTypeBound = function(ctx) {
};


// Enter a parse tree produced by JavaParser#enumDeclaration.
JavaParserListener.prototype.enterEnumDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#enumDeclaration.
JavaParserListener.prototype.exitEnumDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#enumConstants.
JavaParserListener.prototype.enterEnumConstants = function(ctx) {
};

// Exit a parse tree produced by JavaParser#enumConstants.
JavaParserListener.prototype.exitEnumConstants = function(ctx) {
};


// Enter a parse tree produced by JavaParser#enumConstant.
JavaParserListener.prototype.enterEnumConstant = function(ctx) {
};

// Exit a parse tree produced by JavaParser#enumConstant.
JavaParserListener.prototype.exitEnumConstant = function(ctx) {
};


// Enter a parse tree produced by JavaParser#enumBodyDeclarations.
JavaParserListener.prototype.enterEnumBodyDeclarations = function(ctx) {
};

// Exit a parse tree produced by JavaParser#enumBodyDeclarations.
JavaParserListener.prototype.exitEnumBodyDeclarations = function(ctx) {
};


// Enter a parse tree produced by JavaParser#interfaceDeclaration.
JavaParserListener.prototype.enterInterfaceDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#interfaceDeclaration.
JavaParserListener.prototype.exitInterfaceDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#classBody.
JavaParserListener.prototype.enterClassBody = function(ctx) {
};

// Exit a parse tree produced by JavaParser#classBody.
JavaParserListener.prototype.exitClassBody = function(ctx) {
};


// Enter a parse tree produced by JavaParser#interfaceBody.
JavaParserListener.prototype.enterInterfaceBody = function(ctx) {
};

// Exit a parse tree produced by JavaParser#interfaceBody.
JavaParserListener.prototype.exitInterfaceBody = function(ctx) {
};


// Enter a parse tree produced by JavaParser#classBodyDeclaration.
JavaParserListener.prototype.enterClassBodyDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#classBodyDeclaration.
JavaParserListener.prototype.exitClassBodyDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#memberDeclaration.
JavaParserListener.prototype.enterMemberDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#memberDeclaration.
JavaParserListener.prototype.exitMemberDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#methodDeclaration.
JavaParserListener.prototype.enterMethodDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#methodDeclaration.
JavaParserListener.prototype.exitMethodDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#methodBody.
JavaParserListener.prototype.enterMethodBody = function(ctx) {
};

// Exit a parse tree produced by JavaParser#methodBody.
JavaParserListener.prototype.exitMethodBody = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeTypeOrVoid.
JavaParserListener.prototype.enterTypeTypeOrVoid = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeTypeOrVoid.
JavaParserListener.prototype.exitTypeTypeOrVoid = function(ctx) {
};


// Enter a parse tree produced by JavaParser#genericMethodDeclaration.
JavaParserListener.prototype.enterGenericMethodDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#genericMethodDeclaration.
JavaParserListener.prototype.exitGenericMethodDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#genericConstructorDeclaration.
JavaParserListener.prototype.enterGenericConstructorDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#genericConstructorDeclaration.
JavaParserListener.prototype.exitGenericConstructorDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#constructorDeclaration.
JavaParserListener.prototype.enterConstructorDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#constructorDeclaration.
JavaParserListener.prototype.exitConstructorDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#fieldDeclaration.
JavaParserListener.prototype.enterFieldDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#fieldDeclaration.
JavaParserListener.prototype.exitFieldDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#interfaceBodyDeclaration.
JavaParserListener.prototype.enterInterfaceBodyDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#interfaceBodyDeclaration.
JavaParserListener.prototype.exitInterfaceBodyDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#interfaceMemberDeclaration.
JavaParserListener.prototype.enterInterfaceMemberDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#interfaceMemberDeclaration.
JavaParserListener.prototype.exitInterfaceMemberDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#constDeclaration.
JavaParserListener.prototype.enterConstDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#constDeclaration.
JavaParserListener.prototype.exitConstDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#constantDeclarator.
JavaParserListener.prototype.enterConstantDeclarator = function(ctx) {
};

// Exit a parse tree produced by JavaParser#constantDeclarator.
JavaParserListener.prototype.exitConstantDeclarator = function(ctx) {
};


// Enter a parse tree produced by JavaParser#interfaceMethodDeclaration.
JavaParserListener.prototype.enterInterfaceMethodDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#interfaceMethodDeclaration.
JavaParserListener.prototype.exitInterfaceMethodDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#interfaceMethodModifier.
JavaParserListener.prototype.enterInterfaceMethodModifier = function(ctx) {
};

// Exit a parse tree produced by JavaParser#interfaceMethodModifier.
JavaParserListener.prototype.exitInterfaceMethodModifier = function(ctx) {
};


// Enter a parse tree produced by JavaParser#genericInterfaceMethodDeclaration.
JavaParserListener.prototype.enterGenericInterfaceMethodDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#genericInterfaceMethodDeclaration.
JavaParserListener.prototype.exitGenericInterfaceMethodDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#variableDeclarators.
JavaParserListener.prototype.enterVariableDeclarators = function(ctx) {
};

// Exit a parse tree produced by JavaParser#variableDeclarators.
JavaParserListener.prototype.exitVariableDeclarators = function(ctx) {
};


// Enter a parse tree produced by JavaParser#variableDeclarator.
JavaParserListener.prototype.enterVariableDeclarator = function(ctx) {
};

// Exit a parse tree produced by JavaParser#variableDeclarator.
JavaParserListener.prototype.exitVariableDeclarator = function(ctx) {
};


// Enter a parse tree produced by JavaParser#variableDeclaratorId.
JavaParserListener.prototype.enterVariableDeclaratorId = function(ctx) {
};

// Exit a parse tree produced by JavaParser#variableDeclaratorId.
JavaParserListener.prototype.exitVariableDeclaratorId = function(ctx) {
};


// Enter a parse tree produced by JavaParser#variableInitializer.
JavaParserListener.prototype.enterVariableInitializer = function(ctx) {
};

// Exit a parse tree produced by JavaParser#variableInitializer.
JavaParserListener.prototype.exitVariableInitializer = function(ctx) {
};


// Enter a parse tree produced by JavaParser#arrayInitializer.
JavaParserListener.prototype.enterArrayInitializer = function(ctx) {
};

// Exit a parse tree produced by JavaParser#arrayInitializer.
JavaParserListener.prototype.exitArrayInitializer = function(ctx) {
};


// Enter a parse tree produced by JavaParser#classOrInterfaceType.
JavaParserListener.prototype.enterClassOrInterfaceType = function(ctx) {
};

// Exit a parse tree produced by JavaParser#classOrInterfaceType.
JavaParserListener.prototype.exitClassOrInterfaceType = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeArgument.
JavaParserListener.prototype.enterTypeArgument = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeArgument.
JavaParserListener.prototype.exitTypeArgument = function(ctx) {
};


// Enter a parse tree produced by JavaParser#qualifiedNameList.
JavaParserListener.prototype.enterQualifiedNameList = function(ctx) {
};

// Exit a parse tree produced by JavaParser#qualifiedNameList.
JavaParserListener.prototype.exitQualifiedNameList = function(ctx) {
};


// Enter a parse tree produced by JavaParser#formalParameters.
JavaParserListener.prototype.enterFormalParameters = function(ctx) {
};

// Exit a parse tree produced by JavaParser#formalParameters.
JavaParserListener.prototype.exitFormalParameters = function(ctx) {
};


// Enter a parse tree produced by JavaParser#formalParameterList.
JavaParserListener.prototype.enterFormalParameterList = function(ctx) {
};

// Exit a parse tree produced by JavaParser#formalParameterList.
JavaParserListener.prototype.exitFormalParameterList = function(ctx) {
};


// Enter a parse tree produced by JavaParser#formalParameter.
JavaParserListener.prototype.enterFormalParameter = function(ctx) {
};

// Exit a parse tree produced by JavaParser#formalParameter.
JavaParserListener.prototype.exitFormalParameter = function(ctx) {
};


// Enter a parse tree produced by JavaParser#lastFormalParameter.
JavaParserListener.prototype.enterLastFormalParameter = function(ctx) {
};

// Exit a parse tree produced by JavaParser#lastFormalParameter.
JavaParserListener.prototype.exitLastFormalParameter = function(ctx) {
};


// Enter a parse tree produced by JavaParser#qualifiedName.
JavaParserListener.prototype.enterQualifiedName = function(ctx) {
};

// Exit a parse tree produced by JavaParser#qualifiedName.
JavaParserListener.prototype.exitQualifiedName = function(ctx) {
};


// Enter a parse tree produced by JavaParser#literal.
JavaParserListener.prototype.enterLiteral = function(ctx) {
};

// Exit a parse tree produced by JavaParser#literal.
JavaParserListener.prototype.exitLiteral = function(ctx) {
};


// Enter a parse tree produced by JavaParser#integerLiteral.
JavaParserListener.prototype.enterIntegerLiteral = function(ctx) {
};

// Exit a parse tree produced by JavaParser#integerLiteral.
JavaParserListener.prototype.exitIntegerLiteral = function(ctx) {
};


// Enter a parse tree produced by JavaParser#floatLiteral.
JavaParserListener.prototype.enterFloatLiteral = function(ctx) {
};

// Exit a parse tree produced by JavaParser#floatLiteral.
JavaParserListener.prototype.exitFloatLiteral = function(ctx) {
};


// Enter a parse tree produced by JavaParser#annotation.
JavaParserListener.prototype.enterAnnotation = function(ctx) {
};

// Exit a parse tree produced by JavaParser#annotation.
JavaParserListener.prototype.exitAnnotation = function(ctx) {
};


// Enter a parse tree produced by JavaParser#elementValuePairs.
JavaParserListener.prototype.enterElementValuePairs = function(ctx) {
};

// Exit a parse tree produced by JavaParser#elementValuePairs.
JavaParserListener.prototype.exitElementValuePairs = function(ctx) {
};


// Enter a parse tree produced by JavaParser#elementValuePair.
JavaParserListener.prototype.enterElementValuePair = function(ctx) {
};

// Exit a parse tree produced by JavaParser#elementValuePair.
JavaParserListener.prototype.exitElementValuePair = function(ctx) {
};


// Enter a parse tree produced by JavaParser#elementValue.
JavaParserListener.prototype.enterElementValue = function(ctx) {
};

// Exit a parse tree produced by JavaParser#elementValue.
JavaParserListener.prototype.exitElementValue = function(ctx) {
};


// Enter a parse tree produced by JavaParser#elementValueArrayInitializer.
JavaParserListener.prototype.enterElementValueArrayInitializer = function(ctx) {
};

// Exit a parse tree produced by JavaParser#elementValueArrayInitializer.
JavaParserListener.prototype.exitElementValueArrayInitializer = function(ctx) {
};


// Enter a parse tree produced by JavaParser#annotationTypeDeclaration.
JavaParserListener.prototype.enterAnnotationTypeDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#annotationTypeDeclaration.
JavaParserListener.prototype.exitAnnotationTypeDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#annotationTypeBody.
JavaParserListener.prototype.enterAnnotationTypeBody = function(ctx) {
};

// Exit a parse tree produced by JavaParser#annotationTypeBody.
JavaParserListener.prototype.exitAnnotationTypeBody = function(ctx) {
};


// Enter a parse tree produced by JavaParser#annotationTypeElementDeclaration.
JavaParserListener.prototype.enterAnnotationTypeElementDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#annotationTypeElementDeclaration.
JavaParserListener.prototype.exitAnnotationTypeElementDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#annotationTypeElementRest.
JavaParserListener.prototype.enterAnnotationTypeElementRest = function(ctx) {
};

// Exit a parse tree produced by JavaParser#annotationTypeElementRest.
JavaParserListener.prototype.exitAnnotationTypeElementRest = function(ctx) {
};


// Enter a parse tree produced by JavaParser#annotationMethodOrConstantRest.
JavaParserListener.prototype.enterAnnotationMethodOrConstantRest = function(ctx) {
};

// Exit a parse tree produced by JavaParser#annotationMethodOrConstantRest.
JavaParserListener.prototype.exitAnnotationMethodOrConstantRest = function(ctx) {
};


// Enter a parse tree produced by JavaParser#annotationMethodRest.
JavaParserListener.prototype.enterAnnotationMethodRest = function(ctx) {
};

// Exit a parse tree produced by JavaParser#annotationMethodRest.
JavaParserListener.prototype.exitAnnotationMethodRest = function(ctx) {
};


// Enter a parse tree produced by JavaParser#annotationConstantRest.
JavaParserListener.prototype.enterAnnotationConstantRest = function(ctx) {
};

// Exit a parse tree produced by JavaParser#annotationConstantRest.
JavaParserListener.prototype.exitAnnotationConstantRest = function(ctx) {
};


// Enter a parse tree produced by JavaParser#defaultValue.
JavaParserListener.prototype.enterDefaultValue = function(ctx) {
};

// Exit a parse tree produced by JavaParser#defaultValue.
JavaParserListener.prototype.exitDefaultValue = function(ctx) {
};


// Enter a parse tree produced by JavaParser#block.
JavaParserListener.prototype.enterBlock = function(ctx) {
};

// Exit a parse tree produced by JavaParser#block.
JavaParserListener.prototype.exitBlock = function(ctx) {
};


// Enter a parse tree produced by JavaParser#blockStatement.
JavaParserListener.prototype.enterBlockStatement = function(ctx) {
};

// Exit a parse tree produced by JavaParser#blockStatement.
JavaParserListener.prototype.exitBlockStatement = function(ctx) {
};


// Enter a parse tree produced by JavaParser#localVariableDeclaration.
JavaParserListener.prototype.enterLocalVariableDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#localVariableDeclaration.
JavaParserListener.prototype.exitLocalVariableDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#localTypeDeclaration.
JavaParserListener.prototype.enterLocalTypeDeclaration = function(ctx) {
};

// Exit a parse tree produced by JavaParser#localTypeDeclaration.
JavaParserListener.prototype.exitLocalTypeDeclaration = function(ctx) {
};


// Enter a parse tree produced by JavaParser#statement.
JavaParserListener.prototype.enterStatement = function(ctx) {
};

// Exit a parse tree produced by JavaParser#statement.
JavaParserListener.prototype.exitStatement = function(ctx) {
};


// Enter a parse tree produced by JavaParser#catchClause.
JavaParserListener.prototype.enterCatchClause = function(ctx) {
};

// Exit a parse tree produced by JavaParser#catchClause.
JavaParserListener.prototype.exitCatchClause = function(ctx) {
};


// Enter a parse tree produced by JavaParser#catchType.
JavaParserListener.prototype.enterCatchType = function(ctx) {
};

// Exit a parse tree produced by JavaParser#catchType.
JavaParserListener.prototype.exitCatchType = function(ctx) {
};


// Enter a parse tree produced by JavaParser#finallyBlock.
JavaParserListener.prototype.enterFinallyBlock = function(ctx) {
};

// Exit a parse tree produced by JavaParser#finallyBlock.
JavaParserListener.prototype.exitFinallyBlock = function(ctx) {
};


// Enter a parse tree produced by JavaParser#resourceSpecification.
JavaParserListener.prototype.enterResourceSpecification = function(ctx) {
};

// Exit a parse tree produced by JavaParser#resourceSpecification.
JavaParserListener.prototype.exitResourceSpecification = function(ctx) {
};


// Enter a parse tree produced by JavaParser#resources.
JavaParserListener.prototype.enterResources = function(ctx) {
};

// Exit a parse tree produced by JavaParser#resources.
JavaParserListener.prototype.exitResources = function(ctx) {
};


// Enter a parse tree produced by JavaParser#resource.
JavaParserListener.prototype.enterResource = function(ctx) {
};

// Exit a parse tree produced by JavaParser#resource.
JavaParserListener.prototype.exitResource = function(ctx) {
};


// Enter a parse tree produced by JavaParser#switchBlockStatementGroup.
JavaParserListener.prototype.enterSwitchBlockStatementGroup = function(ctx) {
};

// Exit a parse tree produced by JavaParser#switchBlockStatementGroup.
JavaParserListener.prototype.exitSwitchBlockStatementGroup = function(ctx) {
};


// Enter a parse tree produced by JavaParser#switchLabel.
JavaParserListener.prototype.enterSwitchLabel = function(ctx) {
};

// Exit a parse tree produced by JavaParser#switchLabel.
JavaParserListener.prototype.exitSwitchLabel = function(ctx) {
};


// Enter a parse tree produced by JavaParser#forControl.
JavaParserListener.prototype.enterForControl = function(ctx) {
};

// Exit a parse tree produced by JavaParser#forControl.
JavaParserListener.prototype.exitForControl = function(ctx) {
};


// Enter a parse tree produced by JavaParser#forInit.
JavaParserListener.prototype.enterForInit = function(ctx) {
};

// Exit a parse tree produced by JavaParser#forInit.
JavaParserListener.prototype.exitForInit = function(ctx) {
};


// Enter a parse tree produced by JavaParser#enhancedForControl.
JavaParserListener.prototype.enterEnhancedForControl = function(ctx) {
};

// Exit a parse tree produced by JavaParser#enhancedForControl.
JavaParserListener.prototype.exitEnhancedForControl = function(ctx) {
};


// Enter a parse tree produced by JavaParser#parExpression.
JavaParserListener.prototype.enterParExpression = function(ctx) {
};

// Exit a parse tree produced by JavaParser#parExpression.
JavaParserListener.prototype.exitParExpression = function(ctx) {
};


// Enter a parse tree produced by JavaParser#expressionList.
JavaParserListener.prototype.enterExpressionList = function(ctx) {
};

// Exit a parse tree produced by JavaParser#expressionList.
JavaParserListener.prototype.exitExpressionList = function(ctx) {
};


// Enter a parse tree produced by JavaParser#methodCall.
JavaParserListener.prototype.enterMethodCall = function(ctx) {
};

// Exit a parse tree produced by JavaParser#methodCall.
JavaParserListener.prototype.exitMethodCall = function(ctx) {
};


// Enter a parse tree produced by JavaParser#expression.
JavaParserListener.prototype.enterExpression = function(ctx) {
};

// Exit a parse tree produced by JavaParser#expression.
JavaParserListener.prototype.exitExpression = function(ctx) {
};


// Enter a parse tree produced by JavaParser#lambdaExpression.
JavaParserListener.prototype.enterLambdaExpression = function(ctx) {
};

// Exit a parse tree produced by JavaParser#lambdaExpression.
JavaParserListener.prototype.exitLambdaExpression = function(ctx) {
};


// Enter a parse tree produced by JavaParser#lambdaParameters.
JavaParserListener.prototype.enterLambdaParameters = function(ctx) {
};

// Exit a parse tree produced by JavaParser#lambdaParameters.
JavaParserListener.prototype.exitLambdaParameters = function(ctx) {
};


// Enter a parse tree produced by JavaParser#lambdaBody.
JavaParserListener.prototype.enterLambdaBody = function(ctx) {
};

// Exit a parse tree produced by JavaParser#lambdaBody.
JavaParserListener.prototype.exitLambdaBody = function(ctx) {
};


// Enter a parse tree produced by JavaParser#primary.
JavaParserListener.prototype.enterPrimary = function(ctx) {
};

// Exit a parse tree produced by JavaParser#primary.
JavaParserListener.prototype.exitPrimary = function(ctx) {
};


// Enter a parse tree produced by JavaParser#classType.
JavaParserListener.prototype.enterClassType = function(ctx) {
};

// Exit a parse tree produced by JavaParser#classType.
JavaParserListener.prototype.exitClassType = function(ctx) {
};


// Enter a parse tree produced by JavaParser#creator.
JavaParserListener.prototype.enterCreator = function(ctx) {
};

// Exit a parse tree produced by JavaParser#creator.
JavaParserListener.prototype.exitCreator = function(ctx) {
};


// Enter a parse tree produced by JavaParser#createdName.
JavaParserListener.prototype.enterCreatedName = function(ctx) {
};

// Exit a parse tree produced by JavaParser#createdName.
JavaParserListener.prototype.exitCreatedName = function(ctx) {
};


// Enter a parse tree produced by JavaParser#innerCreator.
JavaParserListener.prototype.enterInnerCreator = function(ctx) {
};

// Exit a parse tree produced by JavaParser#innerCreator.
JavaParserListener.prototype.exitInnerCreator = function(ctx) {
};


// Enter a parse tree produced by JavaParser#arrayCreatorRest.
JavaParserListener.prototype.enterArrayCreatorRest = function(ctx) {
};

// Exit a parse tree produced by JavaParser#arrayCreatorRest.
JavaParserListener.prototype.exitArrayCreatorRest = function(ctx) {
};


// Enter a parse tree produced by JavaParser#classCreatorRest.
JavaParserListener.prototype.enterClassCreatorRest = function(ctx) {
};

// Exit a parse tree produced by JavaParser#classCreatorRest.
JavaParserListener.prototype.exitClassCreatorRest = function(ctx) {
};


// Enter a parse tree produced by JavaParser#explicitGenericInvocation.
JavaParserListener.prototype.enterExplicitGenericInvocation = function(ctx) {
};

// Exit a parse tree produced by JavaParser#explicitGenericInvocation.
JavaParserListener.prototype.exitExplicitGenericInvocation = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeArgumentsOrDiamond.
JavaParserListener.prototype.enterTypeArgumentsOrDiamond = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeArgumentsOrDiamond.
JavaParserListener.prototype.exitTypeArgumentsOrDiamond = function(ctx) {
};


// Enter a parse tree produced by JavaParser#nonWildcardTypeArgumentsOrDiamond.
JavaParserListener.prototype.enterNonWildcardTypeArgumentsOrDiamond = function(ctx) {
};

// Exit a parse tree produced by JavaParser#nonWildcardTypeArgumentsOrDiamond.
JavaParserListener.prototype.exitNonWildcardTypeArgumentsOrDiamond = function(ctx) {
};


// Enter a parse tree produced by JavaParser#nonWildcardTypeArguments.
JavaParserListener.prototype.enterNonWildcardTypeArguments = function(ctx) {
};

// Exit a parse tree produced by JavaParser#nonWildcardTypeArguments.
JavaParserListener.prototype.exitNonWildcardTypeArguments = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeList.
JavaParserListener.prototype.enterTypeList = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeList.
JavaParserListener.prototype.exitTypeList = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeType.
JavaParserListener.prototype.enterTypeType = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeType.
JavaParserListener.prototype.exitTypeType = function(ctx) {
};


// Enter a parse tree produced by JavaParser#primitiveType.
JavaParserListener.prototype.enterPrimitiveType = function(ctx) {
};

// Exit a parse tree produced by JavaParser#primitiveType.
JavaParserListener.prototype.exitPrimitiveType = function(ctx) {
};


// Enter a parse tree produced by JavaParser#typeArguments.
JavaParserListener.prototype.enterTypeArguments = function(ctx) {
};

// Exit a parse tree produced by JavaParser#typeArguments.
JavaParserListener.prototype.exitTypeArguments = function(ctx) {
};


// Enter a parse tree produced by JavaParser#superSuffix.
JavaParserListener.prototype.enterSuperSuffix = function(ctx) {
};

// Exit a parse tree produced by JavaParser#superSuffix.
JavaParserListener.prototype.exitSuperSuffix = function(ctx) {
};


// Enter a parse tree produced by JavaParser#explicitGenericInvocationSuffix.
JavaParserListener.prototype.enterExplicitGenericInvocationSuffix = function(ctx) {
};

// Exit a parse tree produced by JavaParser#explicitGenericInvocationSuffix.
JavaParserListener.prototype.exitExplicitGenericInvocationSuffix = function(ctx) {
};


// Enter a parse tree produced by JavaParser#arguments.
JavaParserListener.prototype.enterArguments = function(ctx) {
};

// Exit a parse tree produced by JavaParser#arguments.
JavaParserListener.prototype.exitArguments = function(ctx) {
};



exports.JavaParserListener = JavaParserListener;