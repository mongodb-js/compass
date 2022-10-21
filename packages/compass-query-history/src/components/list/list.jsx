import React, { Component } from 'react';
import PropTypes from 'prop-types';
import mongodbns from 'mongodb-ns';

import { ZeroGraphic } from '../zero-graphic';
import styles from './list.module.less';

const factory = (ListItem, Saving) => {
  class List extends Component {
    static displayName = 'QueryHistoryList';

    static propTypes = {
      items: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
        .isRequired,
      actions: PropTypes.object.isRequired,
      current: PropTypes.object,
      ns: PropTypes.object,
    };

    static defaultProps = {
      items: [],
      current: null,
      ns: mongodbns(''),
    };

    renderSaving = () => {
      const { current, actions } = this.props;

      if (typeof Saving !== 'function' || current === null) {
        return null;
      }

      return (
        <Saving
          key={0}
          className={styles.item}
          model={current}
          actions={actions}
        />
      );
    };

    renderZeroState = (length) => {
      const { current } = this.props;

      if (length === 0 && current === null) {
        return <ZeroGraphic />;
      }

      return null;
    };

    render() {
      const { items, ns, actions } = this.props;

      const renderItems = items
        .filter((item) => item._ns === ns.ns)
        .map((item, index) => (
          <ListItem
            key={index + 1}
            className={styles.item}
            model={item}
            actions={actions}
          />
        ));

      return (
        <div className={styles.component}>
          {this.renderSaving()}
          {this.renderZeroState(renderItems.length)}
          <ul className={styles.items}>{renderItems}</ul>
        </div>
      );
    }
  }

  return List;
};

export default factory;
export { factory as listFactory };
