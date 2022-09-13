import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Editor, EditorVariant, ConfirmationModal } from '@mongodb-js/compass-components';
import { StageAutoCompleter, STAGE_OPERATORS as _STAGE_OPERATORS } from 'mongodb-ace-autocompleter';
import { EditorTextCompleter } from '@mongodb-js/compass-components';

import styles from './import-pipeline.module.less';

/**
 * Title.
 */
const TITLE = 'New Pipeline From Plain Text';

/**
 * Note.
 */
const NOTE = 'Supports MongoDB Shell syntax. Pasting a pipeline will create a new pipeline.';

const STAGE_OPERATORS = _STAGE_OPERATORS.map(op => {
  return {
    ...op,
    snippet: `\\${op.name}: ${op.snippet}`
  };
})

function type(token, type) {
  return token.type.split('.').includes(type);
}

function getPreviousTokenPos(session, row, column, token) {
  if (token.start === 0) {
    return {
      row: row - 1,
      column: session.$rowLengthCache[row - 1]
    };
  } else {
    return {
      row,
      column: token.start
    };
  }
}

function* getScopeTokensBefore(session, pos) {
  let token = session.getTokenAt(pos.row, pos.column);
  let { row, column } = getPreviousTokenPos(
    session,
    pos.row,
    pos.column,
    token
  );
  let skip = 0;
  while (row + column > 0) {
    token = session.getTokenAt(row, column);
    if (!token) {
      return;
    }
    // A very primitive scope tracker: we count opening and closing parens and
    // filter out everything from the sibling blocks that we run into. This can
    // be error-prone, but good enough for our purposes
    skip = Math.max(
      0,
      type(token, 'paren') ? skip + (type(token, 'rparen') ? 1 : -1) : skip
    );
    if (skip === 0) {
      yield token;
    }
    ({ row, column } = getPreviousTokenPos(session, row, column, token));
  }
}

const autocompleter = {
  getCompletions(editor, session, pos, prefix, callback) {
    for (const token of getScopeTokensBefore(session, pos)) {
      if (type(token, 'stage_op')) {
        callback(
          null,
          new StageAutoCompleter(
            '999.999.999',
            EditorTextCompleter,
            [],
            token.value
          ).getCompletions(editor, session, pos, prefix, callback)
        );
        return;
      }
    }
    callback(
      null,
      STAGE_OPERATORS.filter((queryOp) => {
        // This could actually benefit from using something like levenshtein. We
        // know that in this context the only reasonable thing to suggest is stage
        // operators and nothing else
        return queryOp.name.substring(1).startsWith(prefix.replace(/^\$/, ''));
      })
    );
  }
};

/**
 * Import pipeline modal.
 */
class ImportPipeline extends PureComponent {
  static displayName = 'ImportPipelineComponent';

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    closeImport: PropTypes.func.isRequired,
    changeText: PropTypes.func.isRequired,
    createNew: PropTypes.func.isRequired,
    text: PropTypes.string.isRequired,
    error: PropTypes.string
  }

  /**
   * Render the error message.
   *
   * @returns {Component} The component.
   */
  renderError() {
    if (this.props.error) {
      return (
        <div className={styles['import-pipeline-error']}>
          {this.props.error}
        </div>
      );
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <ConfirmationModal
        title={TITLE}
        open={this.props.isOpen}
        onConfirm={this.props.createNew}
        onCancel={this.props.closeImport}
        buttonText="Create New"
        submitDisabled={this.props.text === ''}
        trackingId="import_pipeline_modal"
      >
        <div className={styles['import-pipeline-note']}>{NOTE}</div>
        <div className={styles['import-pipeline-editor']}>
          <Editor
            variant={EditorVariant.Shell}
            text={this.props.text}
            onChangeText={this.props.changeText}
            options={{ minLines: 10 }}
            name="import-pipeline-editor"
            completer={autocompleter}
          />
        </div>
        {this.renderError()}
      </ConfirmationModal>
    );
  }
}

export default ImportPipeline;
