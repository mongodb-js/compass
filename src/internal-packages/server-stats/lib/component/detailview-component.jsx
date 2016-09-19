const React = require('react');
// const debug = require('debug')('mongodb-compass:server-stats:detailview-component');

class DetailViewComponent extends React.Component {

  constructor(props) {
    super(props);
  }

  renderError() {
    return this.props.error.message;
  }

  renderGraph() {
    return (
      <div className="rt-details">
        <header className="rt-details__header">
          <h2 className="rt-details__headerlabel">operation details</h2>
          <div className="rt-details__closebutton" onClick={this.props.closeHandler}>X Close</div>
        </header>
        <div className="rt-details__body">
          <div className="rt-details__opinfo">
            <div className="rt-details__collection-slow">{this.props.data.ns}</div>
            <div className="rt-details__op">{this.props.data.op}</div>
            <div className="rt-details__time">{this.props.data.microsecs_running + ' ms'}</div>
          </div>
          <ul className="rt-details__list">
            <li className="rt-details__item">
              <div className="rt-details__datatype">opid</div>
              <div className="rt-details__datatype-val">{this.props.data.opid}</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">client s</div>
              <div className="rt-details__datatype-val">{this.props.data.client}</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">active</div>
              <div className="rt-details__datatype-val">false</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">wait lock</div>
              <div className="rt-details__datatype-val">false</div>
            </li>
          </ul>
          <div className="rt-details__raw"><text>{JSON.stringify(this.props.data, null, 4)}</text></div>
        </div>
      </div>
    );
  }

  render() {
    return this.props.error ? this.renderError() : this.renderGraph();
  }
}

DetailViewComponent.propTypes = {
  data: React.PropTypes.any.isRequired,
  error: React.PropTypes.any.isRequired,
  closeHandler: React.PropTypes.any.isRequired
};

DetailViewComponent.displayName = 'DetailViewComponent';

module.exports = DetailViewComponent;
