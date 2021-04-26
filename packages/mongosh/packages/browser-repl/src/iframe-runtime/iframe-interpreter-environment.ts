import {
  ContextValue,
  InterpreterEnvironment
} from '@mongosh/browser-runtime-core';

export class IframeInterpreterEnvironment implements InterpreterEnvironment {
  private window: Window;

  constructor(window: Window) {
    this.window = window;
  }

  sloppyEval(code: string): ContextValue {
    return (this.window as any).eval(code);
  }

  getContextObject(): ContextValue {
    return this.window;
  }
}
