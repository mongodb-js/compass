const React = require('react');
const PropTypes = require('prop-types');

/**
 * A checkbox in the create collection dialog.
 */
class CreateCollectionCheckbox extends React.Component {

  /**
   * Render the input.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            onClick={this.props.onClickHandler}
            checked={this.props.checked} />
          <p className={this.props.className}>{this.props.name}</p>
        </label>
        <i onClick={this.props.onHelpClickHandler} className="help"></i>
      </div>
    );
  }
}

CreateCollectionCheckbox.displayName = 'CreateCollectionCheckbox';

CreateCollectionCheckbox.propTypes = {
  onClickHandler: PropTypes.func.isRequired,
  onHelpClickHandler: PropTypes.func.isRequired,
  checked: PropTypes.bool,
  className: PropTypes.string,
  name: PropTypes.string.isRequired
};

module.exports = CreateCollectionCheckbox;
