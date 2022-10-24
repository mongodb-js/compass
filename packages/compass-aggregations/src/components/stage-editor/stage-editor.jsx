import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  Editor,
  EditorVariant,
  EditorTextCompleter,
  StageAutoCompleter
} from '@mongodb-js/compass-editor';
import { connect } from 'react-redux';
import { changeStageValue } from '../../modules/pipeline-builder/stage-editor';

import styles from './stage-editor.module.less';

/**
 * Edit a single stage in the aggregation pipeline.
 */
export class StageEditor extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    stageValue: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    stageOperator: PropTypes.string,
    serverVersion: PropTypes.string.isRequired,
    autocompleteFields: PropTypes.array.isRequired,
    syntaxError: PropTypes.object,
    serverError: PropTypes.object,
  };

  static defaultProps = {
    autocompleteFields: []
  };

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.completer = new StageAutoCompleter(
      this.props.serverVersion,
      EditorTextCompleter,
      this.props.autocompleteFields,
      this.props.stageOperator
    );
    this.editor = null;
  }

  /**
   * @param {Object} prevProps - The previous properties.
   */
  componentDidUpdate(prevProps) {
    if (
      this.props.autocompleteFields !== prevProps.autocompleteFields ||
      this.props.stageOperator !== prevProps.stageOperator ||
      this.props.serverVersion !== prevProps.serverVersion
    ) {
      this.completer.update(
        this.props.autocompleteFields,
        this.props.stageOperator,
        this.props.serverVersion
      );
    }
    if (this.props.stageOperator !== prevProps.stageOperator && this.editor) {
      // Focus the editor when the stage operator has changed.
      this.editor.focus();
    }
    if (this.props.syntaxError && this.props.syntaxError.loc) {
      const { line: row, column } = this.props.syntaxError.loc;
      this.editor?.getSession().setAnnotations([
        {
          row: row - 1,
          column,
          text: this.props.syntaxError.message,
          type: 'error'
        }
      ]);
    } else {
      this.editor?.getSession().setAnnotations([]);
    }
  }

  /**
   * Need to decorate the change event with the stage index before
   * dispatching.
   *
   * @param {String} value - The value of the stage.
   */
  onStageChange = (value) => {
    this.props.onChange(this.props.index, value);
  };

  /**
   * Render the error.
   *
   * @returns {React.Component} The component.
   */
  renderError() {
    if (this.props.serverError) {
      return (
        <div
          data-testid="stage-editor-error-message"
          className={styles['stage-editor-errormsg']}
          title={this.props.serverError.message}
        >
          {this.props.serverError.message}
        </div>
      );
    }
  }

  renderSyntaxError() {
    if (this.props.syntaxError) {
      return (
        <div
          data-testid="stage-editor-syntax-error"
          className={styles['stage-editor-syntax-error']}
          title={this.props.syntaxError.message}
        >
          {!this.props.stageOperator
            ? 'Stage operator is required'
            : !this.props.stageValue
            ? 'Stage value can not be empty'
            : this.props.syntaxError.message}
        </div>
      );
    }
  }

  /**
   * Render the stage editor component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={styles['stage-editor-container']}>
        <div className={styles['stage-editor']}>
          <Editor
            text={this.props.stageValue}
            onChangeText={this.onStageChange}
            variant={EditorVariant.Shell}
            className={styles['stage-editor-ace-editor']}
            name={`aggregations-stage-editor-${this.props.index}`}
            options={{ minLines: 5 }}
            completer={this.completer}
            onLoad={(editor) => {
              this.editor = editor;
            }}
          />
        </div>
        {this.renderSyntaxError()}
        {this.renderError()}
      </div>
    );
  }
}

export default connect(
  (state, ownProps) => {
    const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
    return {
      stageValue: stage.value,
      stageOperator: stage.stageOperator,
      syntaxError: stage.syntaxError ?? null,
      serverError: stage.serverError ?? null,
      serverVersion: state.serverVersion,
      autocompleteFields: state.fields
    };
  },
  { onChange: changeStageValue }
)(StageEditor);
