import { Preprocessor } from './preprocessor';

const LAST_EXPRESSION_CALLBACK_FUNCTION_NAME = '___MONGOSH_LAST_EXPRESSION_CALLBACK';
const LEXICAL_CONTEXT_VARIABLE_NAME = '___MONGOSH_LEXCON';

export type ContextValue = any;

export interface InterpreterEnvironment {
  sloppyEval(code: string): ContextValue;
  getContextObject(): ContextValue;
}

export class Interpreter {
  private environment: InterpreterEnvironment;
  private preprocessor: Preprocessor;

  constructor(environment: InterpreterEnvironment) {
    this.environment = environment;
    const contextObjext = this.environment.getContextObject();
    contextObjext[LEXICAL_CONTEXT_VARIABLE_NAME] = {};
    this.preprocessor = new Preprocessor({
      lastExpressionCallbackFunctionName: LAST_EXPRESSION_CALLBACK_FUNCTION_NAME,
      lexicalContextStoreVariableName: LEXICAL_CONTEXT_VARIABLE_NAME
    });
  }

  async evaluate(code: string): Promise<ContextValue> {
    let result: ContextValue = undefined;
    const contextObjext = this.environment.getContextObject();

    // This callback is called on the last expression in `code`. We store that
    // value and return it as the completion value of the evaluated code.
    contextObjext[LAST_EXPRESSION_CALLBACK_FUNCTION_NAME] = (val: any): void => {
      result = val;
    };

    const preprocessedCode = this.preprocessor.preprocess(code);
    await this.environment.sloppyEval(preprocessedCode);

    return result;
  }
}
