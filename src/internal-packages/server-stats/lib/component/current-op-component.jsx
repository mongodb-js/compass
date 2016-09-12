const React = require('react');
const Actions = require('../action');

// const debug = require('debug')('mongodb-compass:server-stats-currentop-component');
/**
 * Represents the component that renders the current op information.
 */
class CurrentOpComponent extends React.Component {

  /**
   * The current op component should be initialized with a 'store'
   * property, that triggers with the result of a { currentOp: 1 }
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
      Actions.pollCurrentOp();
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
   * Refreshes the component state with the new current op data that was
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
   * Render the table in the component.
   *
   * @returns {React.Component} The table.
   */
  renderGraph() {
    const rows = this.state.data.map(function(row, i) {
      return (
        <li className="rt-lists__item rt-lists__item--slow" key={`list-item-${i}`}>
          <div className="rt-lists__collection-slow">{row.collectionName}</div>
          <div className="rt-lists__op">{row.operationType}</div>
          <div className="rt-lists__time">{row.time + ' ms'}</div>
        </li>
      );
    });
    return (
      <div className="rt-lists">
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Slowest Operations</h2>
        </header>
        <ul className="rt-lists__list">
          {rows}
        </ul>
      </div>
    );
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div>
        {this.state.error ? this.renderError() : this.renderGraph()}
      </div>
    );
  }
}

CurrentOpComponent.propTypes = {
  store: React.PropTypes.any.isRequired,
  interval: React.PropTypes.number.isRequired
};

CurrentOpComponent.displayName = 'CurrentOpComponent';

module.exports = CurrentOpComponent;
