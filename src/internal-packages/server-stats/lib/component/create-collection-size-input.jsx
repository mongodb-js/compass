const React = require('react');

class CreateCollectionSizeInput extends React.Component {

  /**
   * Render the size input.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <div className="form-group">
        <input
          type="text"
          className="form-control create-database-dialog-size-input"
          onChange={this.props.onChangeHandler}
          value={this.props.value}
          placeholder={this.props.placeholder} />
        <p className="create-database-dialog-size-field">{this.props.name}</p>
      </div>
    );
  }
}

CreateCollectionSizeInput.displayName = 'CreateCollectionSizeInput';

CreateCollectionSizeInput.propTypes = {
  onChangeHandler: React.PropTypes.func.isRequired,
  value: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  name: React.PropTypes.string.isRequired
};

module.exports = CreateCollectionSizeInput;
