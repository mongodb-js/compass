import React, { Component } from 'react';
import classnames from 'classnames';
import { PasswordPrompt } from './password-prompt';
import { ShellInput } from './shell-input';
import { ShellOutput, ShellOutputEntry } from './shell-output';
import type { Runtime } from '@mongosh/browser-runtime-core';
import { changeHistory } from '@mongosh/history';
import type { WorkerRuntime } from '@mongosh/node-runtime-worker-thread';

const styles = require('./shell.less');

interface ShellProps {
  /* The runtime used to evaluate code.
   */
  runtime: Runtime | WorkerRuntime;

  /* A function called each time the output changes with an array of
   * ShellOutputEntryes.
   */
  onOutputChanged: (output: readonly ShellOutputEntry[]) => void;

  /* A function called each time the history changes
   * with an array of history entries ordered from the most recent to
   * the oldest entry.
   */
  onHistoryChanged: (history: readonly string[]) => void;

  /* If set, the shell will omit or redact entries containing sensitive
   * info from history. Defaults to `false`.
   */
  redactInfo?: boolean;

  /* The maxiumum number of lines to keep in the output.
   * Defaults to `1000`.
   */
  maxOutputLength: number;

  /* The maxiumum number of lines to keep in the history.
   * Defaults to `1000`.
   */
  maxHistoryLength: number;

  /* A function called when an operation has begun.
   */
  onOperationStarted: () => void;

  /* A function called when an operation has completed (both error and success).
   */
  onOperationEnd: () => void;

  /* An array of entries to be displayed in the output area.
   *
   * Can be used to restore the output between sessions, or to setup
   * a greeting message.
   *
   * Note: new entries will not be appended to the array.
   */
  initialOutput: readonly ShellOutputEntry[];

  /* An array of history entries to prepopulate the history.
   *
   * Can be used to restore the history between sessions.
   *
   * Entries must be ordered from the most recent to the oldest.
   *
   * Note: new entries will not be appended to the array.
   */
  initialHistory: readonly string[];
}

interface ShellState {
  operationInProgress: boolean;
  output: readonly ShellOutputEntry[];
  history: readonly string[];
  passwordPrompt: string;
  shellPrompt: string;
}

const noop = (): void => { /* */ };

/**
 * The browser-repl Shell component
 */
export class Shell extends Component<ShellProps, ShellState> {
  static defaultProps = {
    onHistoryChanged: noop,
    onOperationStarted: noop,
    onOperationEnd: noop,
    onOutputChanged: noop,
    maxOutputLength: 1000,
    maxHistoryLength: 1000,
    initialOutput: [],
    initialHistory: [],
    passwordPrompt: ''
  };

  private shellInputElement: HTMLElement | null = null;
  private shellInputRef?: {
    editor?: HTMLElement;
  };
  private onFinishPasswordPrompt: ((input: string) => void) = noop;
  private onCancelPasswordPrompt: (() => void) = noop;

  readonly state: ShellState = {
    operationInProgress: false,
    output: this.props.initialOutput.slice(-this.props.maxOutputLength),
    history: this.props.initialHistory.slice(0, this.props.maxHistoryLength),
    passwordPrompt: '',
    shellPrompt: '>'
  };

  componentDidMount(): void {
    this.scrollToBottom();
    this.updateShellPrompt();
  }

  componentDidUpdate(): void {
    this.scrollToBottom();
  }

  private evaluate = async(code: string): Promise<ShellOutputEntry> => {
    let outputLine: ShellOutputEntry;

    try {
      this.props.onOperationStarted();

      this.props.runtime.setEvaluationListener(this);
      const result = await this.props.runtime.evaluate(code);
      outputLine = {
        format: 'output',
        type: result.type,
        value: result.printable
      };
    } catch (error) {
      outputLine = {
        format: 'error',
        value: error
      };
    } finally {
      await this.updateShellPrompt();
      this.props.onOperationEnd();
    }

    return outputLine;
  };

  private async updateShellPrompt(): Promise<void> {
    let shellPrompt = '>';
    try {
      shellPrompt = (await this.props.runtime.getShellPrompt()) ?? '>';
    } catch (e) {
      // Just ignore errors when getting the prompt...
    }
    this.setState({ shellPrompt });
  }

  private addEntryToHistory(code: string): readonly string[] {
    const history = [
      code,
      ...this.state.history
    ];

    changeHistory(history, this.props.redactInfo);
    history.splice(this.props.maxHistoryLength);

    Object.freeze(history);

    return history;
  }

  private addEntriesToOutput(entries: readonly ShellOutputEntry[]): readonly ShellOutputEntry[] {
    const output = [
      ...this.state.output,
      ...entries
    ];

    output.splice(0, output.length - this.props.maxOutputLength);

    Object.freeze(output);

    return output;
  }

  onClearCommand = (): void => {
    const output: [] = [];

    Object.freeze(output);

    this.setState({ output });
    this.props.onOutputChanged(output);
  };

  onPrint = (result: { type: string | null; printable: any }[]): void => {
    const output = this.addEntriesToOutput(result.map((entry) => ({
      format: 'output',
      type: entry.type,
      value: entry.printable
    })));
    this.setState({ output });
    this.props.onOutputChanged(output);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPrompt = (question: string, type: 'password'): Promise<string> => {
    const reset = () => {
      this.onFinishPasswordPrompt = noop;
      this.onCancelPasswordPrompt = noop;
      this.setState({ passwordPrompt: '' });
      setTimeout(this.focusEditor, 1);
    };

    const ret = new Promise<string>((resolve, reject) => {
      this.onFinishPasswordPrompt = (result: string) => {
        reset();
        resolve(result);
      };
      this.onCancelPasswordPrompt = () => {
        reset();
        reject(new Error('Canceled by user'));
      };
    });
    this.setState({ passwordPrompt: question });
    return ret;
  };

  private onInput = async(code: string): Promise<void> => {
    if (!code || code.trim() === '') {
      this.appendEmptyInput();
      return;
    }

    const inputLine: ShellOutputEntry = {
      format: 'input',
      value: code
    };

    let output = this.addEntriesToOutput([inputLine]);
    this.setState({
      operationInProgress: true,
      output
    });
    this.props.onOutputChanged(output);

    const outputLine = await this.evaluate(code);

    output = this.addEntriesToOutput([outputLine]);
    const history = this.addEntryToHistory(code);
    this.setState({
      operationInProgress: false,
      output,
      history
    });
    this.props.onOutputChanged(output);
    this.props.onHistoryChanged(history);
  };

  private appendEmptyInput(): void {
    const inputLine: ShellOutputEntry = {
      format: 'input',
      value: ' '
    };

    const output = this.addEntriesToOutput([
      inputLine
    ]);

    this.setState({ output });
  }

  private scrollToBottom(): void {
    if (!this.shellInputElement) {
      return;
    }

    this.shellInputElement.scrollIntoView();
  }

  private onShellClicked = (event: React.MouseEvent): void => {
    // Focus on input when clicking the shell background (not clicking output).
    if (event.currentTarget === event.target) {
      this.focusEditor();
    }
  };

  private focusEditor = (): void => {
    if (this.shellInputRef && this.shellInputRef.editor) {
      this.shellInputRef.editor.focus();
    }
  };

  private onSigInt = (): Promise<boolean> => {
    if (
      this.state.operationInProgress &&
      (this.props.runtime as WorkerRuntime).interrupt
    ) {
      return (this.props.runtime as WorkerRuntime).interrupt();
    }

    return Promise.resolve(false);
  };

  renderInput(): JSX.Element {
    if (this.state.passwordPrompt) {
      return (
        <PasswordPrompt
          onFinish={this.onFinishPasswordPrompt}
          onCancel={this.onCancelPasswordPrompt}
          prompt={this.state.passwordPrompt}
        />
      );
    }

    return (
      <ShellInput
        prompt={this.state.shellPrompt}
        autocompleter={this.props.runtime}
        history={this.state.history}
        onClearCommand={this.onClearCommand}
        onInput={this.onInput}
        operationInProgress={this.state.operationInProgress}
        setInputRef={(ref: { editor?: HTMLElement }): void => {
          this.shellInputRef = ref;
        }}
        onSigInt={this.onSigInt}
      />
    );
  }

  render(): JSX.Element {
    return (
      <div className={classnames(styles.shell)} onClick={this.onShellClicked}>
        <div>
          <ShellOutput output={this.state.output} />
        </div>
        <div
          ref={(el): void => {
            this.shellInputElement = el;
          }}
        >
          {this.renderInput()}
        </div>
      </div>
    );
  }
}
