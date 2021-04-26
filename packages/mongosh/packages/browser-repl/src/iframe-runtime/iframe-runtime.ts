import {
  IframeInterpreterEnvironment
} from './iframe-interpreter-environment';

import {
  Runtime,
  RuntimeEvaluationListener,
  RuntimeEvaluationResult,
  Completion,
  OpenContextRuntime
} from '@mongosh/browser-runtime-core';

import { ServiceProvider } from '@mongosh/service-provider-core';

export class IframeRuntime implements Runtime {
  private openContextRuntime: OpenContextRuntime | null = null;
  private readyPromise: Promise<void> | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private container: HTMLDivElement | null = null;
  private serviceProvider: ServiceProvider;
  private evaluationListener: RuntimeEvaluationListener | null = null;

  constructor(serviceProvider: ServiceProvider) {
    this.serviceProvider = serviceProvider;
  }

  setEvaluationListener(listener: RuntimeEvaluationListener): RuntimeEvaluationListener | null {
    const prev = this.evaluationListener;
    this.evaluationListener = listener;
    if (this.openContextRuntime) {
      this.openContextRuntime.setEvaluationListener(listener);
    }
    return prev;
  }

  async evaluate(code: string): Promise<RuntimeEvaluationResult> {
    const runtime = await this.initialize();
    return await runtime.evaluate(code);
  }

  async getCompletions(code: string): Promise<Completion[]> {
    const runtime = await this.initialize();
    return await runtime.getCompletions(code);
  }

  async getShellPrompt(): Promise<string> {
    const runtime = await this.initialize();
    return await runtime.getShellPrompt();
  }

  async initialize(): Promise<OpenContextRuntime> {
    if (this.readyPromise !== null) {
      await this.readyPromise;
      return this.openContextRuntime as OpenContextRuntime;
    }

    this.container = document.createElement('div');
    this.container.style.display = 'none';

    // NOTE: inserting the iframe directly as dom element does not work with sandboxing.
    this.container.insertAdjacentHTML(
      'beforeend',
      '<iframe src="about:blank" style="display: none" sandbox="allow-same-origin" />');

    const iframe = this.container.firstElementChild as HTMLIFrameElement;
    this.iframe = iframe;
    this.readyPromise = new Promise((resolve) => {
      iframe.onload = (): void => resolve();
    });

    document.body.appendChild(this.container);

    const environment = new IframeInterpreterEnvironment(iframe.contentWindow as Window);
    this.openContextRuntime = new OpenContextRuntime(this.serviceProvider, environment);
    if (this.evaluationListener) {
      this.openContextRuntime.setEvaluationListener(this.evaluationListener);
    }

    return this.initialize();
  }

  async destroy(): Promise<void> {
    if (!this.iframe) {
      return;
    }

    const parent = this.iframe.parentNode;

    if (!parent) {
      return;
    }

    parent.removeChild(this.iframe);
  }
}
