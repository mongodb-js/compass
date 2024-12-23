const timer = require('d3-timer');
const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const DBErrorStore = require('../stores/dberror-store');

// const debug = require('debug')('mongodb-compass:server-stats:top-component');

/**
 * Represents the component that renders the top information.
 */
class TopComponent extends React.Component {
  /**
   * The top component should be initialized with a 'store'
   * property, that triggers with the result of a { top: 1 }
   * command.
   *
   * @param {Object} props - The component properties.
   */
  constructor(props) {
    super(props);
    this.state = { error: null, data: [], display: 'flex' };
  }

  /**
   * When the component mounts, the component will subscribe to the
   * provided store, so that each time the store triggers the component
   * can update its state.
   */
  componentDidMount() {
    this.unsubscribeRefresh = this.props.store.listen(this.refresh.bind(this));
    this.unsubscribeShowOperationDetails = Actions.showOperationDetails.listen(
      this.hide.bind(this)
    );
    this.unsubscribeHideOperationDetails = Actions.hideOperationDetails.listen(
      this.show.bind(this)
    );

    if (!DBErrorStore.ops.top) {
      this.unsubscribeError = DBErrorStore.listen(this.stop.bind(this));
      this.timer = timer.interval(() => {
        Actions.top();
      }, this.props.interval);
    }
  }

  /**
   * When the component unmounts, we unsubscribe from the store and stop the
   * timer.
   */
  componentWillUnmount() {
    this.unsubscribeRefresh();
    this.unsubscribeShowOperationDetails();
    this.unsubscribeHideOperationDetails();

    if (this.unsubscribeError) {
      this.unsubscribeError();
      this.timer.stop();
    }
  }

  stop() {
    if (this.timer) {
      this.timer.stop();
    }
  }

  /**
   * Set the component to visible.
   */
  show() {
    this.setState({ display: 'flex' });
  }

  /**
   * Set the component to hidden.
   */
  hide() {
    this.setState({ display: 'none' });
  }

  /**
   * Refreshes the component state with the new top data that was
   * received from the store.
   *
   * @param {Error} error - The error, if any occured.
   * @param {Object} data - The javascript object for the result of the command.
   */
  refresh(error, data) {
    this.setState({ error: error, data: data });
  }

  /**
   * Render the error message in the component.
   *
   * @returns {String} The error message.
   */
  renderError() {
    return (
      <div className="rt-lists" style={{ display: this.state.display }}>
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Hottest Collections</h2>
        </header>
        <div className="rt-lists__empty-error">&#9888; DATA UNAVAILABLE</div>
      </div>
    );
  }

  /**
   * Render the error message in the component.
   *
   * @returns {React.Component} The zero-state.
   */
  renderZero() {
    return (
      <div className="rt-lists" style={{ display: this.state.display }}>
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Hottest Collections</h2>
        </header>
        <div className="rt-lists__empty-error">&#10004; No Hot Collections</div>
      </div>
    );
  }

  /**
   * Render the graph in the component.
   *
   * @returns {React.Component} The table.
   */
  renderGraph() {
    const rows = this.state.data.map(function (row, i) {
      const styleLoad = { width: `${row.loadPercent}%` };
      const styleLoadR = { width: `${row.loadPercentRead}%` };
      const styleLoadW = { width: `${row.loadPercentWrite}%` };

      return (
        <li className="rt-lists__item" key={`list-item-${i}`}>
          <div className="rt-lists__collection-hot" title={row.collectionName}>
            {row.collectionName}
          </div>
          <div className="rt-lists__load">
            {row.loadPercent}
            <span>%</span>
          </div>
          <div className="rt-lists__rw" style={styleLoad}>
            <div className="rt-lists__r" style={styleLoadR}>
              R
            </div>
            <div className="rt-lists__w" style={styleLoadW}>
              W
            </div>
          </div>
        </li>
      );
    });

    return (
      <div className="rt-lists" style={{ display: this.state.display }}>
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Hottest Collections</h2>
        </header>
        <div className="rt-lists__listdiv" id="div-scroll">
          <ul className="rt-lists__list">{rows}</ul>
        </div>
      </div>
    );
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    if (this.state.error) {
      return this.renderError();
    }
    if (this.state.data.length === 0) {
      return this.renderZero();
    }
    return this.renderGraph();
  }
}

TopComponent.propTypes = {
  store: PropTypes.any.isRequired,
  interval: PropTypes.number.isRequired,
};

TopComponent.displayName = 'TopComponent';

module.exports = TopComponent;
