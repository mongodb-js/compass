import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';

import { Card, CardHeader, CardBody } from '../card';
import Query from '../query';

import styles from './favorite-list-item.module.less';

class FavoriteListItem extends PureComponent {
  static displayName = 'QueryHistoryFavoritesListItem';

  static propTypes = {
    model: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    className: PropTypes.string
  };

  static defaultProps = {};

  copyQuery = () => {
    const { actions, model } = this.props;
    actions.copyQuery(model);
  };

  deleteFavorite = () => {
    const { actions, model } = this.props;
    actions.deleteFavorite(model);
  };

  render() {
    const { model, className } = this.props;
    const { filter, project, sort, skip, limit, collation } = this.props.model;
    const attributes = { filter, project, sort, skip, limit, collation };

    return (
      <Card className={className}>
        <CardHeader title={model._name}>
          <button
            title="Copy Query to Clipboard"
            data-test-id="query-history-button-copy-query"
            className={classnames('btn', 'btn-xs', 'btn-default', styles.button, styles['button-copy'])}
            onClick={this.copyQuery}>
            <FontAwesome name="clipboard"/>
          </button>

          <button
            title="Delete Query from Favorites List"
            data-test-id="query-history-button-delete-fav"
            className={classnames('btn', 'btn-xs', 'btn-default', styles.button)}
            onClick={this.deleteFavorite}>
            <FontAwesome name="trash"/>
          </button>
        </CardHeader>

        <CardBody>
          <Query
            attributes={attributes}
            actions={this.props.actions}
            title={model._name}/>
        </CardBody>
      </Card>
    );
  }
}

export default FavoriteListItem;
export { FavoriteListItem };
