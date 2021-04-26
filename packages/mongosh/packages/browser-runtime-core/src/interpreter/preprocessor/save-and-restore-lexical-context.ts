import { parse } from '@babel/parser';
import generate from '@babel/generator';

import {
  collectTopLevelLexicalContext,
  LexicalContext
} from './collect-top-level-lexical-context';

export {
  LexicalContext
} from './collect-top-level-lexical-context';

type SaveAndRestoreLexicalContextOptions = {
  lexicalContext: LexicalContext;
  lexicalContextStoreVariableName: string;
};

type SaveAndRestoreLexicalContextResult = {
  lexicalContext: LexicalContext;
  ast: any;
};

function saveVariableDeclarationAssignment(
  name: string,
  options: {
    lexicalContextStoreVariableName: string;
  }
): string {
  return `${options.lexicalContextStoreVariableName}['${name}'] = ${name};`;
}

function restoreVariableDeclarationAssignment(
  name: string,
  kind: string,
  options: {
    lexicalContextStoreVariableName: string;
  }
): string {
  const assignment = `${name} = ${options.lexicalContextStoreVariableName}['${name}'];`;

  if (kind === 'class') {
    return `const ${assignment}`;
  }

  if (kind === 'function') {
    return `${assignment}`;
  }

  return `${kind} ${assignment}`;
}

function preventRedeclareFunctionsAsOtherKeywords(
  oldLexicalContext: LexicalContext,
  newLexicalContext: LexicalContext
): void {
  for (const [name, kind] of Object.entries(newLexicalContext)) {
    if (kind !== 'function' && oldLexicalContext[name] === 'function') {
      throw new SyntaxError(`Identifier \'${name}\' has already been declared`);
    }
  }
}

export function saveAndRestoreLexicalContext(
  ast: any,
  options: SaveAndRestoreLexicalContextOptions
): SaveAndRestoreLexicalContextResult {
  const newLexicalContext = collectTopLevelLexicalContext(ast);

  preventRedeclareFunctionsAsOtherKeywords(
    options.lexicalContext,
    newLexicalContext
  );

  const { code } = generate((ast as any));

  let newCode = '';

  for (const [name, kind] of Object.entries(options.lexicalContext)) {
    newCode += restoreVariableDeclarationAssignment(
      name,
      kind,
      options
    );
  }

  newCode += code;

  for (const [name] of Object.entries(newLexicalContext)) {
    newCode += saveVariableDeclarationAssignment(name, options);
  }

  const newAst = parse(newCode, {
    allowAwaitOutsideFunction: true
  });

  return {
    ast: newAst,
    lexicalContext: {
      ...options.lexicalContext,
      ...newLexicalContext
    }
  };
}
