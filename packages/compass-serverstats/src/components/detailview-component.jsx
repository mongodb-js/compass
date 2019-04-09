const React = require('react');
const Actions = require('../actions');
const { IconTextButton } = require('hadron-react-buttons');

// const debug = require('debug')('mongodb-compass:server-stats:detailview-component');

class DetailViewComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = { error: null, data: {}, display: 'none' };
  }

  componentDidMount() {
    this.unsubscribeShowOperationDetails = Actions.showOperationDetails.listen(this.show.bind(this));
    this.unsubscribeHideOperationDetails = Actions.hideOperationDetails.listen(this.hide.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeShowOperationDetails();
    this.unsubscribeHideOperationDetails();
  }

  /**
   * Set the component to visible.
   *
   * @param {Object} data - The operation data.
   */
  show(data) {
    this.setState({ data: data, display: 'block' });
  }

  /**
   * Set the component to hidden.
   */
  hide() {
    this.setState({ data: {}, display: 'none' });
  }

  killOp() {
    Actions.killOp(this.state.data.opid);
    this.hideOperationDetails();
  }

  /**
   * Fire the show operation detail action with the row data.
   */
  hideOperationDetails() {
    Actions.hideOperationDetails();
  }

  removeMs(key, value) {
    if (key === 'ms_running') {
      return undefined;
    }
    return value;
  }

  renderError() {
    return (
      <div style={{ display: this.state.display }}>
        this.state.error.message
      </div>
    );
  }

  renderZero() {
    return (<div style={{ display: this.state.display }}></div>);
  }

  renderGraph() {
    return (
      <div className="rt-details" style={{ display: this.state.display }}>
        <header className="rt-details__header">
          <h2 className="rt-details__headerlabel">operation details</h2>
          <div className="rt-details__closebutton" onClick={this.hideOperationDetails.bind(this)}><i className="fa fa-times"></i>
  Close</div>
        </header>
        <div className="rt-details__body">
          <div className="rt-details__opinfo">
            <div className="rt-details__collection-slow">{this.state.data.ns}</div>
            <div className="rt-details__op">{this.state.data.op}</div>
            <div className="rt-details__time">{this.state.data.ms_running + ' ms'}</div>
          </div>
          <ul className="rt-details__list">
            <li className="rt-details__item">
              <div className="rt-details__datatype">opid</div>
              <div className="rt-details__datatype-val">{this.state.data.opid}</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">client s</div>
              <div className="rt-details__datatype-val">{this.state.data.client}</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">active</div>
              <div className="rt-details__datatype-val">{this.state.data.active}</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">wait lock</div>
              <div className="rt-details__datatype-val">{this.state.data.waitingForLock}</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">
                <IconTextButton
                  text="Kill Op"
                  clickHandler={this.killOp.bind(this)}
                  className="btn btn-alert btn-xs"
                  iconClassName="fa fa-exclamation-circle" />
              </div>
            </li>
          </ul>
          <div className="rt-details__raw"><span>{JSON.stringify(this.state.data, this.removeMs, 4)}</span></div>
        </div>
      </div>
    );
  }

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

DetailViewComponent.displayName = 'DetailViewComponent';

module.exports = DetailViewComponent;
