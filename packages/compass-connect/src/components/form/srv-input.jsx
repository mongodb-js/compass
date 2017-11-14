const React = require('react');
const PropTypes = require('prop-types');
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
        <input
          name="srv-record"
          onChange={this.onSRVRecordToggle.bind(this)}
          checked={this.props.currentConnection.isSrvRecord}
          className="form-control-checkbox"
          type="checkbox" />
      </div>
    );
  }
}

SRVInput.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

SRVInput.displayName = 'SRVInput';

module.exports = SRVInput;
