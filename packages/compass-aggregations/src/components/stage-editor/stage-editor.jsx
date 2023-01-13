import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Editor,
  EditorVariant,
  EditorTextCompleter,
  StageAutoCompleter
} from '@mongodb-js/compass-editor';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import { css, cx, spacing, palette, Banner, withDarkMode } from '@mongodb-js/compass-components';

import { changeStageValue } from '../../modules/pipeline-builder/stage-editor';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const editorContainerStyles = css({
  position: 'relative',
  textAlign: 'center',
  overflow: 'hidden',
});

const editorStyles = css({
  flexShrink: 0,
  margin: 0,
  padding: `${spacing[2]}px 0 ${spacing[2]}px 0`,
  width: '100%',
  minHeight: '200px'
});

const editorContainerStylesDark = css({
  background: palette.gray.dark3,
});

const editorContainerStylesLight = css({
  background: palette.gray.light3,
});

const aceEditorStyles = css({
  minHeight: '160px'
});

const bannerStyles = css({
  margin: spacing[2],
  textAlign: 'left'
});

/**
 * Edit a single stage in the aggregation pipeline.
 */
class UnthemedStageEditor extends PureComponent {
  static propTypes = {
    darkMode: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired,
    stageValue: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    stageOperator: PropTypes.string,
    serverVersion: PropTypes.string.isRequired,
    autocompleteFields: PropTypes.array.isRequired,
    syntaxError: PropTypes.object,
    serverError: PropTypes.object,
    num_stages: PropTypes.number.isRequired,
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
    this.initialValue = props.stageValue;
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

  onBlur = () => {
    const value = this.editor?.getValue();
    if (
      this.initialValue !== undefined &&
      value !== undefined &&
      value !== this.initialValue
    ) {
      track('Aggregation Edited', {
        num_stages: this.props.num_stages,
        stage_index: this.props.index + 1,
        stage_action: 'stage_content_changed',
        stage_name: this.props.stageOperator,
        editor_view_type: 'stage',
      });
      this.initialValue = value;
    }
  };

  /**
   * Render the error.
   *
   * @returns {React.Component} The component.
   */
  renderError() {
    if (this.props.serverError) {
      return (
        <Banner
          variant="danger"
          data-testid="stage-editor-error-message"
          title={this.props.serverError.message}
          className={bannerStyles}
        >
          {this.props.serverError.message}
        </Banner>
      );
    }
  }

  renderSyntaxError() {
    if (this.props.syntaxError) {
      return (
        <Banner
          variant="warning"
          data-testid="stage-editor-syntax-error"
          title={this.props.syntaxError.message}
          className={bannerStyles}
        >
          {!this.props.stageOperator
            ? 'Stage operator is required'
            : !this.props.stageValue
            ? 'Stage value can not be empty'
            : this.props.syntaxError.message}
          </Banner>
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
      <div className={cx(editorContainerStyles, this.props.darkMode ? editorContainerStylesDark : editorContainerStylesLight)}>
        <div className={editorStyles}>
          <Editor
            text={this.props.stageValue}
            onChangeText={this.onStageChange}
            variant={EditorVariant.Shell}
            className={aceEditorStyles}
            name={`aggregations-stage-editor-${this.props.index}`}
            options={{ minLines: 5 }}
            completer={this.completer}
            onLoad={(editor) => {
              this.editor = editor;
            }}
            onBlur={this.onBlur}
          />
        </div>
        {this.renderSyntaxError()}
        {this.renderError()}
      </div>
    );
  }
}

// exported for tests
export const StageEditor = withDarkMode(UnthemedStageEditor);

export default connect(
  (state, ownProps) => {
    const stages = state.pipelineBuilder.stageEditor.stages;
    const stage = stages[ownProps.index];
    const num_stages = stages.length;
    return {
      stageValue: stage.value,
      stageOperator: stage.stageOperator,
      syntaxError: !stage.empty ? (stage.syntaxError ?? null) : null,
      serverError: !stage.empty ? (stage.serverError ?? null) : null,
      serverVersion: state.serverVersion,
      autocompleteFields: state.fields,
      num_stages,
    };
  },
  { onChange: changeStageValue }
)(StageEditor);
