import type {
  ArrayPattern,
  AssignmentPattern,
  ClassDeclaration,
  File,
  FunctionDeclaration,
  Identifier,
  ObjectPattern,
  ObjectProperty,
  RestElement,
  VariableDeclaration,
  VariableDeclarator
} from '@babel/types';

type VariableDeclarationKind = 'let' | 'const' | 'class' | 'function' | 'var';

export interface LexicalContext {
  [variableName: string]: VariableDeclarationKind;
}

export function collectTopLevelLexicalContext(ast: File): LexicalContext {
  const context: LexicalContext = {};

  for (const node of ast.program.body) {
    if (node.type === 'FunctionDeclaration') {
      collectFunctionDeclaration(node, context);
    }

    if (node.type === 'ClassDeclaration') {
      collectClassDeclaration(node, context);
    }

    if (node.type === 'VariableDeclaration') {
      collectVariableDeclaration(node, context);
    }
  }

  return context;
}

function collectFunctionDeclaration(functionDeclarationNode: FunctionDeclaration, context: LexicalContext): void {
  if (functionDeclarationNode.id !== null) {
    collectIdentifier(functionDeclarationNode.id, context, 'function');
  }
}
function collectClassDeclaration(classDeclarationNode: ClassDeclaration, context: LexicalContext): void {
  collectIdentifier(classDeclarationNode.id, context, 'class');
}

function collectVariableDeclaration(variableDeclarationNode: VariableDeclaration, context: LexicalContext): void {
  const kind = variableDeclarationNode.kind;

  for (const declarator of variableDeclarationNode.declarations) {
    collectVariableDeclarator(declarator, context, kind);
  }
}

function collectVariableDeclarator(
  variableDeclaration: VariableDeclarator,
  context: LexicalContext,
  kind: VariableDeclarationKind): void {
  const child = variableDeclaration.id;

  if (child.type === 'Identifier') {
    collectIdentifier(child, context, kind);
  }

  if (child.type === 'ObjectPattern') {
    collectObjectPattern(child, context, kind);
  }

  if (child.type === 'ArrayPattern') {
    collectArrayPattern(child, context, kind);
  }
}

function collectIdentifier(
  identifier: Identifier,
  context: LexicalContext,
  kind: VariableDeclarationKind): void {
  context[identifier.name] = kind;
}

function collectObjectPattern(
  objectPatternNode: ObjectPattern,
  context: LexicalContext,
  variableDeclarationKind: VariableDeclarationKind): void {
  for (const property of objectPatternNode.properties) {
    if (property.type === 'RestElement') {
      collectRestElement(property, context, variableDeclarationKind);
    }

    if (property.type === 'ObjectProperty') {
      collectObjectProperty(property, context, variableDeclarationKind);
    }
  }
}

function collectObjectProperty(
  objectPropertyNode: ObjectProperty,
  context: LexicalContext,
  variableDeclarationKind: VariableDeclarationKind): void {
  if (objectPropertyNode.value.type === 'Identifier') {
    collectIdentifier(objectPropertyNode.value, context, variableDeclarationKind);
  }

  if (objectPropertyNode.value.type === 'ObjectPattern') {
    collectObjectPattern(objectPropertyNode.value, context, variableDeclarationKind);
  }

  if (objectPropertyNode.value.type === 'ArrayPattern') {
    collectArrayPattern(objectPropertyNode.value, context, variableDeclarationKind);
  }

  if (objectPropertyNode.value.type === 'AssignmentPattern') {
    collectAssignmentPattern(objectPropertyNode.value, context, variableDeclarationKind);
  }
}

function collectAssignmentPattern(
  assignmentPatternNode: AssignmentPattern,
  context: LexicalContext,
  variableDeclarationKind: VariableDeclarationKind): void {
  if (assignmentPatternNode.left.type === 'Identifier') {
    collectIdentifier(assignmentPatternNode.left, context, variableDeclarationKind);
  }

  if (assignmentPatternNode.left.type === 'ObjectPattern') {
    collectObjectPattern(assignmentPatternNode.left, context, variableDeclarationKind);
  }
}

function collectRestElement(
  restElementNode: RestElement,
  context: LexicalContext,
  variableDeclarationKind: VariableDeclarationKind): void {
  if (restElementNode.argument.type === 'Identifier') {
    collectIdentifier(restElementNode.argument, context, variableDeclarationKind);
  }
}

function collectArrayPattern(
  arrayPatternNode: ArrayPattern,
  context: LexicalContext,
  variableDeclarationKind: VariableDeclarationKind): void {
  for (const element of arrayPatternNode.elements) {
    if (!element) {
      continue;
    }

    if (element.type === 'RestElement') {
      collectRestElement(element, context, variableDeclarationKind);
    }

    if (element.type === 'Identifier') {
      collectIdentifier(element, context, variableDeclarationKind);
    }

    if (element.type === 'ObjectPattern') {
      collectObjectPattern(element, context, variableDeclarationKind);
    }

    if (element.type === 'AssignmentPattern') {
      collectAssignmentPattern(element, context, variableDeclarationKind);
    }
  }
}
