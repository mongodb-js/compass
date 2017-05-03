const React = require('react');
const PropTypes = require('prop-types');

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
  autoFocus: PropTypes.bool,
  onChangeHandler: PropTypes.func.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired
};

CreateCollectionInput.defaultProps = {
  autoFocus: false
};

module.exports = CreateCollectionInput;
