import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Editor, EditorVariant, EditorTextCompleter } from '@mongodb-js/compass-components';
import { StageAutoCompleter } from 'mongodb-ace-autocompleter';

import styles from './stage-editor.module.less';

/**
 * Edit a single stage in the aggregation pipeline.
 */
class StageEditor extends Component {
  static displayName = 'StageEditorComponent';

  static propTypes = {
    stage: PropTypes.string,
    stageOperator: PropTypes.string,
    error: PropTypes.string,
    syntaxError: PropTypes.string,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    fields: PropTypes.array.isRequired,
    stageChanged: PropTypes.func.isRequired,
    isValid: PropTypes.bool.isRequired,
    projections: PropTypes.array.isRequired,
  };

  static defaultProps = {
    fields: [],
    projections: []
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
      this.getFieldsAndProjections(),
      this.props.stageOperator
    );
  }

  /**
   * @param {Object} prevProps - The previous properties.
   */
  componentDidUpdate(prevProps) {
    this.completer.update(
      this.getFieldsAndProjections(),
      this.props.stageOperator
    );
    this.completer.version = this.props.serverVersion;
    if (this.props.stageOperator !== prevProps.stageOperator && this.editor) {
      // Focus the editor when the stage operator has changed.
      this.editor.focus();
    }
  }

  /**
   * Need to decorate the change event with the stage index before
   * dispatching.
   *
   * @param {String} value - The value of the stage.
   */
  onStageChange = (value) => {
    this.props.stageChanged(this.props.index, value);
  };

  /**
   * Combines all fields and projections into a single array for
   * auto-completer.
   * @returns {Array}
   */
  getFieldsAndProjections() {
    const { fields, projections, index } = this.props;
    const previouslyDefinedProjections = projections.filter(
      (p) => p.index < index
    );

    const fieldsAndProjections = [].concat.call(
      [],
      fields,
      previouslyDefinedProjections
    );
    console.log({fieldsAndProjections})
    return fieldsAndProjections;
  }

  /**
   * Render the error.
   *
   * @returns {React.Component} The component.
   */
  renderError() {
    if (this.props.error) {
      return (
        <div
          data-testid="stage-editor-error-message"
          className={styles['stage-editor-errormsg']}
          title={this.props.error}>
          {this.props.error}
        </div>
      );
    }
  }

  renderSyntaxError() {
    if (!this.props.isValid && this.props.syntaxError) {
      return (
        <div
          data-testid="stage-editor-syntax-error"
          className={styles['stage-editor-syntax-error']}
          title={this.props.syntaxError}>
          {this.props.syntaxError}
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
            text={this.props.stage}
            onChangeText={this.onStageChange}
            variant={EditorVariant.Shell}
            className={styles['stage-editor-ace-editor']}
            name={`aggregations-stage-editor-${this.props.index}`}
            options={({minLines: 5})}
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

export default StageEditor;
