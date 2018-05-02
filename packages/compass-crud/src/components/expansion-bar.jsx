import React from 'react';
import PropTypes from 'prop-types';

/**
 * The expander class.
 */
const EXPANDER = 'btn btn-default btn-xs';

/**
 * The arrow down class.
 */
const ARROW_DOWN = 'fa fa-arrow-down';

/**
 * The arrow up class.
 */
const ARROW_UP = 'fa fa-arrow-up';

/**
 * The maximum number of extra elements to render per
 * "Show N more fields" button click.
 */
const MAX_EXTRA_ELEMENTS = 1000;

class ExpansionBar extends React.PureComponent {

  /**
   * Handle clicking the "Hide N fields" button.
   */
  handleHideClick() {
    this.props.setRenderSize(this.props.initialSize);
  }

  /**
   * Handle clicking the "Show N more fields" button.
   */
  handleShowClick() {
    const newSize = Math.min(this.props.renderSize + this.props.perClickSize,
                             this.props.totalSize);
    this.props.setRenderSize(newSize);
  }

  /**
   * Render the "Show N more fields" button.
   *
   * @param {Number|String} showMoreFields  How many additional fields to show
   * @returns {React.Component} The "Show N more fields" button.
   */
  renderShowMoreFieldsButton(showMoreFields) {
    const showText = `Show ${showMoreFields} more fields`;
    return (
      <button
        key="EXPANSION_BAR_SHOW"
        className={`${EXPANDER} expansion-bar-show`}
        onClick={this.handleShowClick.bind(this)}>
        <i className={ARROW_DOWN} aria-hidden="true" />
        <span>{showText}</span>
      </button>
    );
  }

  /**
   * Render the "Hide M fields" button.
   *
   * @param {Number|String} hideFields  How many fields to be hidden from view
   * @returns {React.Component} The "Hide M fields" button.
   */
  renderHideFieldsButton(hideFields) {
    const hideText = `Hide ${hideFields} fields`;
    return (
      <button
        key="EXPANSION_BAR_HIDE"
        className={`${EXPANDER} expansion-bar-hide`}
        onClick={this.handleHideClick.bind(this)}>
        <i className={ARROW_UP} aria-hidden="true" />
        <span>{hideText}</span>
      </button>
    );
  }

  /**
   * Render the show/hide fields bar.
   *
   * Clicking "Show N more fields" adds up to MAX_EXTRA_FIELDS at a time,
   * clicking "Hide M fields" hides drops back to this.props.initialSize.
   *
   * @returns {React.Component} The expander bar.
   */
  render() {
    const components = [];
    const total = this.props.totalSize;
    if (total > this.props.initialSize) {
      const showMoreFields = Math.min(total - this.props.renderSize,
                                      this.props.perClickSize);
      const hideFields = this.props.renderSize - this.props.initialSize;
      if (this.props.renderSize < total) {
        components.push(this.renderShowMoreFieldsButton(showMoreFields));
      }
      if (this.props.renderSize > this.props.initialSize && !this.props.disableHideButton) {
        components.push(this.renderHideFieldsButton(hideFields));
      }
    }
    return (
      <div className="expansion-bar">
        {components}
      </div>
    );
  }
}

ExpansionBar.propTypes = {
  disableHideButton: PropTypes.bool,            // Flag to disable display of the "Hide M fields" button
  initialSize: PropTypes.number.isRequired,     // Initial number of elements to render
  perClickSize: PropTypes.number,               // Extra elements to render per click
  renderSize: PropTypes.number.isRequired,      // Current number of elements to be rendered
  setRenderSize: PropTypes.func.isRequired,     // Callback to allow the new renderSize to be set outside the component
  totalSize: PropTypes.number.isRequired        // Maximum number of elements to render
};

ExpansionBar.defaultProps = {
  disableHideButton: false,
  perClickSize: MAX_EXTRA_ELEMENTS
};

export default ExpansionBar;
