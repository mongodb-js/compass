import React from 'react';
import PropTypes from 'prop-types';
import InfoSprinkle from './info-sprinkle';

/**
 * A checkbox in the create collection dialog.
 */
class ModalCheckbox extends React.Component {
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
            onChange={this.props.onClickHandler}
            checked={this.props.checked}
            className={this.props.inputClassName}
          />
          <span className={this.props.titleClassName}>
            {this.props.name}
          </span>
        </label>
        {this.props.helpUrl && (
          <InfoSprinkle
            helpLink={this.props.helpUrl}
            onClickHandler={this.props.onLinkClickHandler}
          />
        )}
      </div>
    );
  }
}

ModalCheckbox.displayName = 'ModalCheckboxComponent';

ModalCheckbox.propTypes = {
  onClickHandler: PropTypes.func.isRequired,
  onLinkClickHandler: PropTypes.func.isRequired,
  checked: PropTypes.bool,
  helpUrl: PropTypes.string,
  titleClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  name: PropTypes.string.isRequired
};

export default ModalCheckbox;
