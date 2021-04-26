import { Completion } from './autocompleter/autocompleter';
import { ShellResult, EvaluationListener } from '@mongosh/shell-evaluator';

export type ContextValue = any;

export type RuntimeEvaluationResult = Pick<
  ShellResult,
  'type' | 'printable' | 'source'
>;

export interface RuntimeEvaluationListener extends EvaluationListener {
  onPrint?: (value: RuntimeEvaluationResult[]) => Promise<void> | void;
}

export interface Runtime {
  /**
   * Sets a listener for certain events, e.g. onPrint() when print() is called
   * in the shell.
   *
   * @param {RuntimeEvaluationListener} listener - The new listener.
   * @return {RuntimeEvaluationListener | null} The previous listener, if any.
   */
  setEvaluationListener(
    listener: RuntimeEvaluationListener
  ): RuntimeEvaluationListener | null;

  /**
   * Evaluates code
   *
   * @param {string} code - A string of code
   * @return {Promise<RuntimeEvaluationResult>} the result of the evaluation
   */
  evaluate(code: string): Promise<RuntimeEvaluationResult>;

  /**
   * Get shell api completions give a code prefix
   *
   * @param {string} code - The code to be completed
   */
  getCompletions(code: string): Promise<Completion[]>;

  /**
   * Get the prompt to display for the shell.
   */
  getShellPrompt(): Promise<string>;
}
