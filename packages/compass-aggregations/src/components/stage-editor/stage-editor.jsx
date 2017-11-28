import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import ace from 'brace';
import Completer from 'models/completer';

import 'brace/ext/language_tools';
import 'brace/mode/javascript';
import 'brace/theme/github';

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  enableLiveAutocompletion: true,
  tabSize: 2,
  fontSize: 12,
  minLines: 1,
  maxLines: Infinity,
  showGutter: true
};

/**
 * Edit a single stage in the aggregation pipeline.
 */
class StageEditor extends PureComponent {
  static displayName = 'StageEditorComponent';

  static propTypes = {
    stage: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    onStageChange: PropTypes.func.isRequired
  }

  /**
   * @todo: Figure out best place to put this based on how acequire
   *  actually works under the covers.
   */
  componentDidMount() {
    ace.acequire('ace/ext/language_tools').setCompleters([ new Completer() ]);
  }

  /**
   * Need to decorate the change event with the stage index before
   * dispatching.
   *
   * @param {String} value - The value of the stage.
   */
  onStageChange(value) {
    this.props.onStageChange(value, this.props.index);
  }

  /**
   * Render the stage editor component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <AceEditor
        mode="javascript"
        theme="github"
        width="100%"
        value={this.props.stage}
        onChange={this.onStageChange.bind(this)}
        name={`aggregations-stage-editor-${this.props.index}`}
        setOptions={OPTIONS} />
    );
  }
}

export default StageEditor;
export { StageEditor };
