import Icon from '@leafygreen-ui/icon';
import { Autocompleter } from '@mongosh/browser-runtime-core';
import classnames from 'classnames';
import React, { Component } from 'react';
import { Editor } from './editor';
import ShellLoader from './shell-loader';
import { LineWithIcon } from './utils/line-with-icon';

const styles = require('./shell-input.less');

interface ShellInputProps {
  autocompleter?: Autocompleter;
  history?: readonly string[];
  onClearCommand?(): void | Promise<void>;
  onInput?(code: string): void | Promise<void>;
  operationInProgress?: boolean;
  prompt?: string;
  setInputRef?(ref: { editor?: HTMLElement }): void;
  onSigInt?(): Promise<boolean>;
}

interface ShellInputState {
  currentValue: string;
  readOnly: boolean;
  didLoadHistoryItem: boolean;
}

export class ShellInput extends Component<ShellInputProps, ShellInputState> {
  readonly state: ShellInputState = {
    currentValue: '',
    readOnly: false,
    didLoadHistoryItem: false
  };

  private historyNavigationEntries: string[] = [];
  private historyNavigationIndex = 0;

  constructor(props: ShellInputProps) {
    super(props);
    this.initializeHistoryNavigation();
  }

  componentDidUpdate(prevProps: ShellInputProps): void {
    if (prevProps.history !== this.props.history) {
      this.initializeHistoryNavigation();
    }

    if (this.historyNavigationIndex === 0) {
      this.historyNavigationEntries[0] = this.state.currentValue;
    }
  }

  private initializeHistoryNavigation(): void {
    this.historyNavigationEntries = [
      this.state.currentValue,
      ...(this.props.history || [])
    ];

    this.historyNavigationIndex = 0;
  }

  private onChange = (value: string): void => {
    this.setState({ currentValue: value, didLoadHistoryItem: false });
  };

  private syncCurrentValueWithHistoryNavigation(): void {
    const value = this.historyNavigationEntries[this.historyNavigationIndex];

    if (value === undefined) {
      return;
    }

    this.setState({
      currentValue: value,
      didLoadHistoryItem: true
    });
  }

  private historyBack = (): void => {
    if (this.historyNavigationIndex >= this.historyNavigationEntries.length - 1) {
      return;
    }

    this.historyNavigationIndex++;

    this.syncCurrentValueWithHistoryNavigation();
  };

  private historyNext = (): void => {
    if (this.historyNavigationIndex <= 0) {
      return;
    }

    this.historyNavigationIndex--;

    this.syncCurrentValueWithHistoryNavigation();
  };

  private onEnter = async(): Promise<void> => {
    if (this.props.onInput) {
      await this.props.onInput(this.state.currentValue);
    }

    this.setState({
      currentValue: ''
    });
  };

  render(): JSX.Element {
    let prompt: JSX.Element;
    if (this.props.operationInProgress) {
      prompt = (<ShellLoader />);
    } else if (this.props.prompt) {
      const trimmed = this.props.prompt.trim();
      if (trimmed.endsWith('>')) {
        prompt = (<>
          <span>{trimmed.replace(/>$/g, '')}</span>
          <Icon
            size={12}
            glyph={'ChevronRight'}
          />
        </>);
      } else {
        prompt = (<span>{trimmed}</span>);
      }
    } else {
      prompt = (<Icon
        size={12}
        glyph={'ChevronRight'}
      />);
    }

    const editor = (
      <Editor
        autocompleter={this.props.autocompleter}
        onArrowUpOnFirstLine={this.historyBack}
        onArrowDownOnLastLine={this.historyNext}
        onChange={this.onChange}
        onEnter={this.onEnter}
        onClearCommand={this.props.onClearCommand}
        setInputRef={this.props.setInputRef}
        value={this.state.currentValue}
        operationInProgress={this.props.operationInProgress}
        moveCursorToTheEndOfInput={this.state.didLoadHistoryItem}
        onSigInt={this.props.onSigInt}
      />
    );

    const className = classnames(styles['shell-input']);

    return (
      <LineWithIcon className={className} icon={prompt}>
        {editor}
      </LineWithIcon>
    );
  }
}
