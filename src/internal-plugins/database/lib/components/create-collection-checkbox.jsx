const React = require('react');
const PropTypes = require('prop-types');
const { InfoSprinkle } = require('hadron-react-components');
const { shell } = require('electron');

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
      <div>
        <label>
          <input
            type="checkbox"
            onClick={this.props.onClickHandler}
            checked={this.props.checked}
            className={this.props.inputClassName} />
          <p className={this.props.titleClassName}>{this.props.name}</p>
        </label>
        <InfoSprinkle
          helpLink={this.props.helpUrl}
          onClickHandler={shell.openExternal}
        />
      </div>
    );
  }
}

CreateCollectionCheckbox.displayName = 'CreateCollectionCheckbox';

CreateCollectionCheckbox.propTypes = {
  onClickHandler: PropTypes.func.isRequired,
  checked: PropTypes.bool,
  helpUrl: PropTypes.string,
  titleClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  name: PropTypes.string.isRequired
};

module.exports = CreateCollectionCheckbox;
