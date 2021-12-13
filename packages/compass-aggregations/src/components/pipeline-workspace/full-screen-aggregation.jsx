/* eslint-disable react/sort-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import { StageAutoCompleter } from 'mongodb-ace-autocompleter';
import tools from 'ace-builds/src-noconflict/ext-language_tools';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

import styles from './full-screen-aggregation.module.less';

class FullScreenAggregation extends PureComponent {
  static displayName = 'PipelineWorkspace';

  static propTypes = {
    serverVersion: PropTypes.string.isRequired,
    fields: PropTypes.array.isRequired,
    runAggregation: PropTypes.func.isRequired,
    errorMessage: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    documents: PropTypes.array.isRequired,
    query: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    const textCompleter = tools.textCompleter;
    this.completer = new StageAutoCompleter(
      this.props.serverVersion,
      textCompleter,
      this.props.fields
    );
  }

  onRunStage() {
    const query = this.editor.getValue();
    this.props.runAggregation(query);
  }

  renderDocuments() {
    const { loading, documents } = this.props;
    if (loading) {
      return (
        <p>Fetching results ... </p>
      );
    }

    if (documents.length === 0) {
      return (
        <p>No documents ... </p>
      );
    }

    return (
      <div>
        {documents.map((doc, i) => {
          return (<Document doc={new HadronDocument(doc)} editable={false} key={i} tz="UTC" />);
        })}
      </div>
    );
  }

  render() {
    return (
      <div className={styles['full-screen-aggregation']}>
        <div className={styles['aggregation-editor']}>
          <AceEditor
            mode="mongodb"
            theme="mongodb"
            value={this.props.query}
            editorProps={{ $blockScrolling: Infinity }}
            name={'aggregations-editor'}
            width={'100%'}
            setOptions={{
              enableLiveAutocompletion: true,
              tabSize: 2,
              fontSize: 11,
              minLines: 50,
              maxLines: Infinity,
              showGutter: true,
              useWorker: false,
              highlightActiveLine: true,
            }}
            onFocus={() => {
              tools.setCompleters([this.completer]);
            }}
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
        <div className={styles['aggregation-result']}>
          {this.renderDocuments()}
        </div>
      </div>
    );
  }
}

export default FullScreenAggregation;
