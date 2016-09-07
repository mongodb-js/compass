'use strict';

const _ = require('lodash');
const React = require('react');
const IndexModel = require('mongodb-index-model');
const Index = require('./index');
const LoadIndexesStore = require('../store/load-indexes-store');
const SortIndexesStore = require('../store/sort-indexes-store');

/**
 * Component for the index list.
 */
class IndexList extends React.Component {

  /**
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeLoad = LoadIndexesStore.listen(this.handleIndexChange.bind(this));
    this.unsubscribeSort = SortIndexesStore.listen(this.handleIndexChange.bind(this));
  }

  /**
   * Unsubscribe on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeLoad();
    this.unsubscribeSort();
  }

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
    var maxSize = this._computeMaxSize();
    var indexes = _.map(this.state.indexes, (index) => {
      var model = new IndexModel(new IndexModel().parse(index));
      model.relativeSize = model.size / maxSize * 100;
      return (<Index key={model.name} index={model} />);
    });
    return (
      <tbody className='table'>
        {indexes}
      </tbody>
    );
  }

  _computeMaxSize() {
    return _.max(this.state.indexes, (index) => {
      return index.size;
    }).size;
  }
}

IndexList.displayName = 'IndexList';

module.exports = IndexList;
