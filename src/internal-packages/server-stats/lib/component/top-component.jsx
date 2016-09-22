const React = require('react');
const Actions = require('../action');
// const debug = require('debug')('mongodb-compass:server-stats-top-component');

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
    this.state = { error: null, data: []};
  }

  /**
   * When the component mounts, the component will subscribe to the
   * provided store, so that each time the store triggers the component
   * can update its state.
   */
  componentDidMount() {
    this.unsubscribeRefresh = this.props.store.listen(this.refresh.bind(this));
    this.intervalId = setInterval(() => {
      Actions.pollTop();
    }, this.props.interval);
  }

  /**
   * When the component unmounts, we unsubscribe from the store and stop the
   * timer.
   */
  componentWillUnmount() {
    this.unsubscribeRefresh();
    clearInterval(this.intervalId);
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
    return this.state.error.message;
  }

  /**
   * Render the error message in the component.
   *
   * @returns {React.Component} The zero-state.
   */
  renderZero() {
    return (
      <div className="rt-lists">
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Hottest Collections</h2>
        </header>
        <div className="rt-lists__empty">no collections</div>
      </div>
    );
  }

  /**
   * Render the graph in the component.
   *
   * @returns {React.Component} The table.
   */
  renderGraph() {
    const rows = this.state.data.map(function(row, i) {
      const styleLoad = { width: `${row.loadPercent}%` };
      const styleLoadR = { width: `${row.loadPercentR}%` };
      const styleLoadW = { width: `${row.loadPercentW}%` };

      return (
        <li className="rt-lists__item" key={`list-item-${i}`}>
          <div className="rt-lists__collection-hot">
            {row.collectionName}
          </div>
          <div className="rt-lists__load">
            {row.loadPercent}
            <span>%</span>
          </div>
          <div className="rt-lists__rw" style={styleLoad}>
            <div className="rt-lists__r" style={styleLoadR}>R</div>
            <div className="rt-lists__w" style={styleLoadW}>W</div>
          </div>
        </li>
      );
    });

    return (
      <div className="rt-lists">
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Hottest Collections</h2>
        </header>
        <div className="rt-lists__listdiv">
          <ul className="rt-lists__list">
            {rows}
          </ul>
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
    if (this.state.data.length === 0) {
      return this.renderZero();
    }
    return this.state.error ? this.renderError() : this.renderGraph();
  }
}

TopComponent.propTypes = {
  store: React.PropTypes.any.isRequired,
  interval: React.PropTypes.number.isRequired
};

TopComponent.displayName = 'TopComponent';

module.exports = TopComponent;
