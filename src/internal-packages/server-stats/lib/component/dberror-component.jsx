const React = require('react');

/**
 * Represents the component that renders DB Errors.
 */
class DBErrorComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = { data: [] };
  }

  componentDidMount() {
    this.unsubscribeRefresh = this.props.store.listen(this.refresh.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeRefresh();
  }

  refresh(data) {
    this.setState({ data: data });
  }

  renderErrors() {
    const rows = this.state.data.map(function(row, i) {
      return (
        <li className="rt-errors__item status-row status-row-has-error" key={`list-item-${i}`}>
          <div className="rt-errors__operror"><text>&#9888; Command &#34;{row.ops}&#34; returned error </text><text className="rt-errors__bold">&#34;{row.errorMsg}&#34;</text></div>
        </li>
      );
    });
    return (
      <div className="rt-errors">
        <ul className="rt-errors__list">
          {rows}
        </ul>
      </div>
    );
  }

  render() {
    return this.state.data.length ? this.renderErrors() : null;
  }

}

DBErrorComponent.propTypes = {
  store: React.PropTypes.any.isRequired
};

DBErrorComponent.displayName = 'DBErrorComponent';

module.exports = DBErrorComponent;
