const React = require('react');
const PropTypes = require('prop-types');
const { InfoSprinkle } = require('hadron-react-components');
const { shell } = require('electron');

/**
 * The help icon for capped collections url.
 */
const HELP_URL = 'https://docs.mongodb.com/manual/core/capped-collections/';

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
        <InfoSprinkle
          helpLink={HELP_URL}
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
  className: PropTypes.string,
  name: PropTypes.string.isRequired
};

module.exports = CreateCollectionCheckbox;
