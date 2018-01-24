import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import ace from 'brace';
import classnames from 'classnames';
import Completer from 'models/completer';

import styles from './stage-editor.less';

import 'brace/ext/language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  enableLiveAutocompletion: true,
  tabSize: 2,
  fontSize: 11,
  minLines: 5,
  maxLines: Infinity,
  showGutter: true,
  useWorker: false
};

/**
 * Edit a single stage in the aggregation pipeline.
 */
class StageEditor extends PureComponent {
  static displayName = 'StageEditorComponent';

  static propTypes = {
    stage: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    fields: PropTypes.array.isRequired,
    stageChanged: PropTypes.func.isRequired
  }

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    const tools = ace.acequire('ace/ext/language_tools');
    const textCompleter = tools.textCompleter;
    this.completer = new Completer(
      this.props.serverVersion,
      textCompleter,
      this.props.index,
      this.props.fields
    );
    tools.setCompleters([ this.completer ]);
  }

  /**
   * Update the autocompleter index and fields.
   *
   * @param {Object} nextProps - The new properties.
   */
  componentWillReceiveProps(nextProps) {
    this.completer.fields = nextProps.fields;
    this.completer.index = nextProps.index;
  }

  /**
   * On update if the stage operator is changed insert the snippet and focus on the editor.
   *
   * @param {Object} prevProps - The previous properties.
   */
  componentDidUpdate(prevProps) {
    if (this.props.stage.stageOperator !== prevProps.stage.stageOperator && this.editor) {
      this.editor.setValue('');
      this.editor.insertSnippet(this.props.stage.snippet);
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
    this.props.stageChanged(value, this.props.index);
  }

  /**
   * Render the stage editor component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-editor'])}>
        <AceEditor
          mode="mongodb"
          theme="mongodb"
          width="100%"
          value={this.props.stage.stage}
          onChange={this.onStageChange}
          editorProps={{ $blockScrolling: Infinity }}
          name={`aggregations-stage-editor-${this.props.index}`}
          setOptions={OPTIONS}
          onLoad={(editor) => {
            this.editor = editor;
          }}
        />
      </div>
    );
  }
}

export default StageEditor;
