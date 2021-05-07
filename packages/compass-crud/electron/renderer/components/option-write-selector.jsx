const React = require('react');
const PropTypes = require('prop-types');
const { OptionSelector } = require('hadron-react-components');

/**
 * The wrapper class.
 */
const WRAPPER = 'tooltip-button-wrapper';

/**
 * Option Selector Button component that is aware of the write state of the
 * application.
 * This button contains only text, no icons, no animations. Hadron Components'
 * OptionSelector is an extension of React-Bootstrap DropdownButton.
 */
class OptionWriteSelector extends React.Component {

  /**
   * Determine if the application is in a writable state.
   *
   * @returns {Boolean} If the application is writable.
   */
  isWritable() {
    return true;
  }

  /**
   * Get the tooltip text.
   *
   * @returns {String} The tooltip text.
   */
  tooltipText() {
    if (!this.isWritable()) {
      return WriteStateStore.state.description;
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={WRAPPER}>
        <OptionSelector
          id={this.props.id}
          label={this.props.label}
          title={this.props.title}
          bsSize={this.props.bsSize}
          options={this.props.options}
          disabled={!this.isWritable()}
          className={this.props.className}
          onSelect={this.props.onSelect}/>
      </div>
    );
  }
}

OptionWriteSelector.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  title: PropTypes.oneOfType([ PropTypes.object, PropTypes.string ]),
  bsSize: PropTypes.string,
  id: PropTypes.string.isRequired,
  isCollectionLevel: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  options: PropTypes.object.isRequired,
  tooltipId: PropTypes.string.isRequired
}

OptionWriteSelector.displayName = 'OptionWriteSelector';

module.exports = OptionWriteSelector;
