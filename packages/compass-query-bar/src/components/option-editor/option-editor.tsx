import React, { Component } from 'react';
import { QueryAutoCompleter } from 'mongodb-ace-autocompleter';
import {
  Editor,
  EditorVariant,
  EditorTextCompleter,
  css,
  cx,
  focusRingStyles,
  focusRingVisibleStyles,
  uiColors,
  spacing,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';

import type { QueryOption as QueryOptionType } from '../../constants/query-option-definition';

const editorStyles = cx(
  css({
    '&::before': {
      position: 'absolute',
      content: '""',
      pointerEvents: 'none',
      top: 3,
      right: 3,
      bottom: 3,
      left: 3,
      borderRadius: spacing[1],
      boxShadow: 'inset 0px 0px 0px 0px transparent',
      transition: 'box-shadow .16s ease-in',
    },
    borderRadius: '6px',
    '&:hover': {
      '&::after': {
        boxShadow: `0 0 0 3px ${uiColors.gray.light2}`,
        transitionTimingFunction: 'ease-out',
      },
    },
    '&:focus-within': focusRingVisibleStyles,
  }),
  focusRingStyles
);

const editorWithErrorStyles = css({
  '&:focus-within': {
    '&::before': {
      boxShadow: 'inset 0 0 0 1px transparent',
    },
  },
  '&::before': {
    zIndex: 5,
    boxShadow: `inset 0px 0px 0px 1px ${uiColors.red.base}`,
  },
});

type OptionEditorProps = {
  autoPopulated: boolean;
  hasError: boolean;
  id: string;
  onChange: (value: string) => void;
  onApply: () => void;
  placeholder?: string;
  queryOption: QueryOptionType;
  refreshEditorAction: Listenable;
  schemaFields?: string[];
  serverVersion?: string;
  value?: any;
};

export class OptionEditor extends Component<OptionEditorProps> {
  completer: any;
  boundOnFieldsChanged: (schemaFields?: string[]) => void;
  unsub?: () => void;
  editor: any;

  static defaultProps = {
    queryOption: '',
    value: '',
    serverVersion: '3.6.0',
    autoPopulated: false,
    schemaFields: [],
  };

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props: OptionEditorProps) {
    super(props);
    this.completer = new QueryAutoCompleter(
      props.serverVersion,
      EditorTextCompleter,
      props.schemaFields
    );
    this.boundOnFieldsChanged = this.onFieldsChanged.bind(this);
  }

  /**
   * Subscribe on mount.
   */
  componentDidMount(): void {
    this.unsub = this.props.refreshEditorAction.listen(() => {
      this.editor.setValue(this.props.value);
      this.editor.clearSelection();
    });
  }

  /**
   * @param {Object} nextProps - The next properties.
   *
   * @returns {Boolean} If the component should update.
   */
  shouldComponentUpdate(nextProps: OptionEditorProps): boolean {
    this.boundOnFieldsChanged(nextProps.schemaFields);
    return (
      nextProps.autoPopulated ||
      nextProps.serverVersion !== this.props.serverVersion ||
      nextProps.hasError !== this.props.hasError
    );
  }

  /**
   * Unsubscribe listeners.
   */
  componentWillUnmount(): void {
    this.unsub?.();
  }

  onFieldsChanged(schemaFields?: string[]): void {
    this.completer.update(schemaFields);
  }

  /**
   * Render the editor.
   *
   * @returns {Component} The component.
   */
  render(): JSX.Element {
    return (
      <Editor
        variant={EditorVariant.Shell}
        className={cx(
          editorStyles,
          this.props.hasError && editorWithErrorStyles
        )}
        theme="mongodb-query"
        text={this.props.value}
        onChangeText={(value) => this.props.onChange(value)}
        name={`query-bar-option-input-${this.props.queryOption}`}
        options={{
          useSoftTabs: true,
          minLines: 1,
          maxLines: 10,
          fontSize: 12,
          highlightActiveLine: false,
          showPrintMargin: false,
          showGutter: false,
        }}
        id={this.props.id}
        completer={this.completer}
        placeholder={this.props.placeholder}
        scrollMargin={[14, 14, 0, 0]}
        onLoad={(editor) => {
          this.editor = editor;
          this.editor.setBehavioursEnabled(true);
          this.editor.commands.addCommand({
            name: 'executeQuery',
            bindKey: {
              win: 'Enter',
              mac: 'Enter',
            },
            exec: () => {
              this.props.onApply();
            },
          });
        }}
      />
    );
  }
}

export default OptionEditor;
