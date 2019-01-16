import React from 'react';
import PropTypes from 'prop-types';
import map from 'lodash.map';
import IndexComponent from 'components/index-component';
import { SortIndexesStore, UpdateIndexesStore } from 'stores';

/**
 * Component for the index list.
 */
class IndexList extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { indexes: [] };
  }

  /**
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeSort = SortIndexesStore.listen(this.handleIndexChange.bind(this));
    this.unsubscribeUpdate = UpdateIndexesStore.listen(this.handleIndexChange.bind(this));
  }

  /**
   * Unsubscribe on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeSort();
    this.unsubscribeUpdate();
  }

  /**
   * Handles the sort indexes store triggering with indexes in a new order or the
   * initial load of indexes.
   *
   * @param {Array} indexes - The indexes.
   */
  handleIndexChange(indexes) {
    this.setState({ indexes: indexes });
  }

  /**
   * Render the index list.
   *
   * @returns {React.Component} The index list.
   */
  render() {
    const indexes = map(this.state.indexes, (model) => {
      return (<IndexComponent key={model.name} index={model} isReadonly={this.props.isReadonly} />);
    });
    return (
      <tbody className="table">
        {indexes}
      </tbody>
    );
  }
}

IndexList.displayName = 'IndexList';

IndexList.propTypes = {
  isReadonly: PropTypes.bool.isRequired
};

export default IndexList;
