import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';

import { Card, CardHeader, CardBody } from 'components/card';
import Query from 'components/query';

import styles from './favorite-list-item.less';

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

    const attributes = this.props.model.getAttributes({ props: true });

    Object.keys(attributes)
      .filter(key => key.charAt(0) === '_')
      .forEach(key => delete attributes[key]);

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
            title={model._name}/>
        </CardBody>
      </Card>
    );
  }
}

export default FavoriteListItem;
export { FavoriteListItem };
