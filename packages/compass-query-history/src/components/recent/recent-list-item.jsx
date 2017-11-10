import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';

import { Card, CardHeader, CardBody } from 'components/card';
import Query from 'components/query';

import styles from './recent-list-item.less';

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

    const attributes = this.props.model.getAttributes({ props: true });

    Object.keys(attributes)
      .filter(key => key.charAt(0) === '_')
      .forEach(key => delete attributes[key]);

    return (
      <Card className={className}>
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
          <Query attributes={attributes} />
        </CardBody>
      </Card>
    );
  }
}

export default RecentListItem;
export { RecentListItem };
