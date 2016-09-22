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
    return (
      <div className="rt-lists">
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Slowest Operations</h2>
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
      <div className="rt-lists">
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Slowest Operations</h2>
        </header>
        <div className="rt-lists__empty-error">&#10004; No Current Operations</div>
      </div>
    );
  }

  /**
   * Render the table in the component.
   *
   * @returns {React.Component} The table.
   */
  renderGraph() {
    const handler = this.props.clickHandler;
    const rows = this.state.data.map(function(row, i) {
      return (
        <li className="rt-lists__item rt-lists__item--slow" key={`list-item-${i}`}>
          <div className="rt-lists__collection-slow">{row.ns}</div>
          <div className="rt-lists__op" onClick={handler.bind(null, row)}>{row.op}</div>
          <div className="rt-lists__time">{row.microsecs_running + ' ms'}</div>
        </li>
      );
    });
    return (
      <div className="rt-lists">
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Slowest Operations</h2>
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
    if (this.state.error) {
      return this.renderError();
    }
    if (this.state.data.length === 0) {
      return this.renderZero();
    }
    return this.renderGraph();
  }
}

CurrentOpComponent.propTypes = {
  store: React.PropTypes.any.isRequired,
  interval: React.PropTypes.number.isRequired,
  clickHandler: React.PropTypes.any.isRequired
};

CurrentOpComponent.displayName = 'CurrentOpComponent';

module.exports = CurrentOpComponent;
