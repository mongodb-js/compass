import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';

import { Card, CardHeader, CardBody } from '../card';
import Query from '../query';

import styles from './recent-list-item.module.less';

class RecentListItem extends PureComponent {
  static displayName = 'QueryHistoryRecentListItem';

  static propTypes = {
    model: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    className: PropTypes.string
  };

  static defaultProps = {};

  saveRecent = () => {
    const { actions, model } = this.props;
    actions.saveRecent(model);
  };

  copyQuery = () => {
    const { actions, model } = this.props;
    actions.copyQuery(model);
  };

  deleteRecent = () => {
    const { actions, model } = this.props;
    actions.deleteRecent(model);
  };

  render() {
    const { model, className } = this.props;
    const { filter, project, sort, skip, limit, collation } = this.props.model;
    const attributes = { filter, project, sort, skip, limit, collation };

    return (
      <Card data-testid="recent-query-list-item" className={className}>
        <CardHeader title={model._lastExecuted.toString()}>
          <button
            title="Favorite Query"
            data-test-id="query-history-button-fav"
            className={classnames('btn', 'btn-xs', 'btn-default', styles.button)}
            onClick={this.saveRecent}>
            <FontAwesome name="star-o"/>
          </button>

          <button
            title="Copy Query to Clipboard"
            data-test-id="query-history-button-copy-query"
            className={classnames('btn', 'btn-xs', 'btn-default', styles.button, styles['button-copy'])}
            onClick={this.copyQuery}>
            <FontAwesome name="clipboard"/>
          </button>

          <button
            title= "Delete Query from Recent List"
            data-test-id="query-history-button-delete-recent"
            className={classnames('btn', 'btn-xs', 'btn-default', styles.button)}
            onClick={this.deleteRecent}>
            <FontAwesome name="trash"/>
          </button>
        </CardHeader>

        <CardBody>
          <Query attributes={attributes} actions={this.props.actions} />
        </CardBody>
      </Card>
    );
  }
}

export default RecentListItem;
export { RecentListItem };
