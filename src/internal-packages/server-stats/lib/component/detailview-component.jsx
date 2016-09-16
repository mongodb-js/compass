const React = require('react');
// const debug = require('debug')('mongodb-compass:server-stats-detailview-component');

class DetailViewComponent extends React.Component {

  constructor(props) {
    super(props);
  }

  renderError() {
    return this.state.error.message;
  }
/**
 
 <div className="rt-details__raw"></div>
*/
  renderGraph() {
    return (
      <div className="rt-details">
        <header className="rt-details__header">
          <h2 className="rt-details__headerlabel">operation details</h2>
          <div className="rt-details__closebutton" onClick={this.props.closeHandler}>X Close</div>
        </header>
        <div className="rt-details__body">
          <div className="rt-details__opinfo">
            <div className="rt-details__collection-slow">{this.props.data.collectionName}</div>
            <div className="rt-details__op">{this.props.data.operationType}</div>
            <div className="rt-details__time">{this.props.data.time + ' ms'}</div>
          </div>
          <ul className="rt-details__list">
            <li className="rt-details__item">
              <div className="rt-details__datatype">opid</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">client s</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">active</div>
            </li>
            <li className="rt-details__item">
              <div className="rt-details__datatype">wait lock</div>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  render() {
    // return (
    //   <div>
    //     {this.state.error ? this.renderError() : this.renderGraph()}
    //   </div>
    // );
    return this.renderGraph();
  }
}

DetailViewComponent.propTypes = {
  data: React.PropTypes.any.isRequired,
  closeHandler: React.PropTypes.any.isRequired
};

DetailViewComponent.displayName = 'DetailViewComponent';

module.exports = DetailViewComponent;
