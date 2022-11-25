import React, { Component } from 'react';
import PropTypes from 'prop-types';
import mongodbns from 'mongodb-ns';

import { spacing, css } from '@mongodb-js/compass-components';

import { ZeroGraphic } from '../zero-graphic';

const componentStyles = css({
  overflowY: 'auto',
  padding: spacing[3],
  paddingTop: 0,
});

const factory = (ListItem) => {
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
          <ListItem key={index + 1} model={item} actions={actions} />
        ));

      return (
        <div className={componentStyles}>
          {this.renderZeroState(renderItems.length)}
          <div>{renderItems}</div>
        </div>
      );
    }
  }

  return List;
};

export default factory;
export { factory as listFactory };
