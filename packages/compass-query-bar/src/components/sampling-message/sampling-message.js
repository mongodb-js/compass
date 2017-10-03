import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import app from 'hadron-app';
import { InfoSprinkle } from 'hadron-react-components';
import { shell } from 'electron';
import numeral from 'numeral';
import pluralize from 'pluralize';

import styles from './sampling-message.less';

/**
 * The help URLs for things like the Documents tab.
 */
const HELP_URLS = Object.freeze({
  DOCUMENTS: 'https://docs.mongodb.com/compass/master/documents/',
  SCHEMA_SAMPLING: 'https://docs.mongodb.com/compass/current/faq/#what-is-sampling-and-why-is-it-used'
});

class SamplingMessage extends Component {
  static displayName = 'SamplingMessage';

  static propTypes = {
    sampleSize: PropTypes.number,
    insertHandler: PropTypes.func
  };

  state = {
    count: 0,
    loaded: 0
  }

  componentDidMount() {
    const crudActions = app.appRegistry.getAction('CRUD.Actions');

    this.documentRemovedAction = crudActions.documentRemoved;
    this.refreshDocumentsAction = crudActions.refreshDocuments;

    this.resetDocumentListStore = app.appRegistry.getStore('CRUD.ResetDocumentListStore');
    this.insertDocumentStore = app.appRegistry.getStore('CRUD.InsertDocumentStore');
    this.loadMoreDocumentsStore = app.appRegistry.getStore('CRUD.LoadMoreDocumentsStore');

    this.unsubscribeReset = this.resetDocumentListStore.listen(this.handleReset);
    this.unsubscribeInsert = this.insertDocumentStore.listen(this.handleInsert);
    this.unsubscribeRemove = this.documentRemovedAction.listen(this.handleRemove);
    this.unsubscribeLoadMore = this.loadMoreDocumentsStore.listen(this.handleLoadMore);
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
    this.unsubscribeInsert();
    this.unsubscribeRemove();
    this.unsubscribeLoadMore();
  }

  /**
   * Handle updating the count on document insert.
   *
   * @param {Boolean} success - If the insert succeeded.
   */
  handleInsert = (success) => {
    if (success) {
      this.setState({ count: this.state.count + 1 });
    }
  };

  /**
   * Handle updating the count on document removal.
   */
  handleRemove = () => {
    this.setState({
      count: this.state.count - 1,
      loaded: this.state.loaded - 1
    });
  };

  /**
   * Handle the reset of the document list.
   *
   * @param {Object} error - The error
   * @param {Array} documents - The documents.
   * @param {Integer} count - The count.
   */
  handleReset = (error, documents, count) => {
    if (!error) {
      this.setState({
        count: count,
        loaded: (count < 20) ? count : 20
      });
    }
  };

  /**
   * Handle scrolling that loads more documents.
   *
   * @param {Object} error - The error
   * @param {Array} documents - The loaded documents.
   */
  handleLoadMore = (error, documents) => {
    if (!error) {
      this.setState({
        loaded: this.state.loaded + documents.length
      });
    }
  };

  /**
   * Handle refreshing the document list.
   */
  handleRefreshDocuments = () => {
    this.refreshDocumentsAction();
  };

  _loadedMessage = () => {
    const { count, loaded } = this.state;

    if (count > 20) {
      return (
        <span>
          Displaying documents <b>1-{loaded}</b>&nbsp;
        </span>
      );
    }
  };

  _samplePercentage = () => {
    const { sampleSize } = this.props;
    const { count } = this.state;
    const percent = (count === 0) ? 0 : sampleSize / count;

    return numeral(percent).format('0.00%');
  };

  /**
   * Render the sampling message.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    const { sampleSize } = this.props;
    const { count } = this.state;
    const noun = pluralize('document', count);

    return (
      <div className={classnames(styles.component)}>
        Query returned&nbsp;
        <b>{count}</b>&nbsp;{noun}.
        This report is based on a sample of&nbsp;
        <b>{sampleSize}</b>&nbsp;{noun} ({this._samplePercentage()}).

        <InfoSprinkle
          helpLink={HELP_URLS.SCHEMA_SAMPLING}
          onClickHandler={shell.openExternal} />
      </div>
    );
  }
}

export default SamplingMessage;
export { SamplingMessage };
