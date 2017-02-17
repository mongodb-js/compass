const React = require('react');

/**
 * An input field in the create collection checkbox.
 */
class CreateCollectionInput extends React.Component {

  /**
   * Render the input.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <div className="form-group">
        <p>{this.props.name}</p>
        <input
          autoFocus={this.props.autoFocus}
          id={this.props.id}
          type="text"
          className="form-control"
          onChange={this.props.onChangeHandler}
          value={this.props.value} />
      </div>
    );
  }
}

CreateCollectionInput.displayName = 'CreateCollectionInput';

CreateCollectionInput.propTypes = {
  autoFocus: React.PropTypes.bool,
  onChangeHandler: React.PropTypes.func.isRequired,
  value: React.PropTypes.string,
  name: React.PropTypes.string.isRequired,
  id: React.PropTypes.string.isRequired
};

CreateCollectionInput.defaultProps = {
  autoFocus: false
};

module.exports = CreateCollectionInput;
