import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Editor, EditorVariant, EditorTextCompleter } from '@mongodb-js/compass-components';
import debounce from 'lodash.debounce';
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
    snippet: PropTypes.string,
    error: PropTypes.string,
    syntaxError: PropTypes.string,
    runStage: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    fields: PropTypes.array.isRequired,
    stageChanged: PropTypes.func.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    isValid: PropTypes.bool.isRequired,
    setIsModified: PropTypes.func.isRequired,
    projections: PropTypes.array.isRequired,
    projectionsChanged: PropTypes.func.isRequired,
    newPipelineFromPaste: PropTypes.func.isRequired
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
    this.debounceRun = debounce(this.onRunStage, 750);
  }

  /**
   * Should the component update?
   *
   * @param {Object} nextProps - The next properties.
   *
   * @returns {Boolean} If the component should update.
   */
  shouldComponentUpdate(nextProps) {
    return (
      nextProps.stageOperator !== this.props.stageOperator ||
      nextProps.error !== this.props.error ||
      nextProps.syntaxError !== this.props.syntaxError ||
      nextProps.index !== this.props.index ||
      nextProps.serverVersion !== this.props.serverVersion ||
      nextProps.fields.length !== this.props.fields.length ||
      nextProps.projections.length !== this.props.projections.length ||
      nextProps.isValid !== this.props.isValid
    );
  }

  /**
   * On update if the stage operator is changed insert the snippet and focus on the editor.
   *
   * @param {Object} prevProps - The previous properties.
   */
  componentDidUpdate(prevProps) {
    this.completer.update(
      this.getFieldsAndProjections(),
      this.props.stageOperator
    );
    this.completer.version = this.props.serverVersion;
    if (this.props.stageOperator !== prevProps.stageOperator && this.editor) {
      this.editor.focus();

      // When the underlying stage operator changes, re-run the preview.
      if (this.props.isAutoPreviewing) {
        this.debounceRun();
      }
    }
  }

  /**
   * Need to decorate the change event with the stage index before
   * dispatching.
   *
   * @param {String} value - The value of the stage.
   */
  onStageChange = (value) => {
    if (this.props.stageOperator === null && value && value.charAt(0) === '[') {
      this.props.newPipelineFromPaste(value);
      this.props.runStage(0);
      return;
    }

    this.props.stageChanged(value, this.props.index);
    this.props.projectionsChanged();
    this.props.setIsModified(true);

    if (this.props.isAutoPreviewing) {
      this.debounceRun();
    }
  };

  /**
   * Need to decorate the change event with the stage index before
   * dispatching.
   */
  onRunStage = () => {
    this.props.runStage(this.props.index);
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
          data-test-id="stage-editor-error-message"
          className={styles['stage-editor-errormsg']}
          title={this.props.error}>
          {this.props.error}
        </div>
      );
    }
  }

  renderSyntaxError() {
    if (!this.props.isValid) {
      return (
        <div
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
            showPrintMargin={false}
            onLoad={(editor) => {
              this.editor = editor;
              this.editor.commands.addCommand({
                name: 'executePipeline',
                bindKey: {
                  win: 'Ctrl-Enter',
                  mac: 'Command-Enter'
                },
                exec: () => {
                  this.onRunStage();
                }
              });
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
