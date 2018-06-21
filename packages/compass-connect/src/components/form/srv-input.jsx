const React = require('react');
const PropTypes = require('prop-types');
const Switch = require('react-ios-switch');
const Actions = require('../../actions');

class SRVInput extends React.Component {

  onSRVRecordToggle() {
    Actions.onSRVRecordToggle();
  }

  render() {
    return (
      <div className="form-item">
        <label>
          <span className="form-item-label">
            SRV Record
          </span>
        </label>
        <div className="form-item-switch-wrapper">
          <Switch
            checked={this.props.currentConnection.isSrvRecord}
            onChange={this.onSRVRecordToggle.bind(this)}
            className="form-control-switch"
            onColor="rgb(19, 170, 82)"
            style={{ backgroundColor: 'rgb(255,255,255)'}}
            />
        </div>
      </div>
    );
  }
}

SRVInput.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

SRVInput.displayName = 'SRVInput';

module.exports = SRVInput;
