import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'hadron-react-components';
import WriteStateStore from '../stores/write-state-store';
import { OptionSelector } from 'hadron-react-components';

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
  static displayName = 'OptionWriteSelector';

  static propTypes = {
    label: PropTypes.string,
    title: PropTypes.oneOfType([ PropTypes.string, PropTypes.object ]),
    bsSize: PropTypes.string,
    className: PropTypes.string,
    id: PropTypes.string.isRequired,
    isCollectionLevel: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired,
    tooltipId: PropTypes.string.isRequired
  }

  /**
   * Subscribe to the state changing stores.
   */
  componentDidMount() {
    // TODO: we can replace this with instance store/model usage, but really we should drop this whole component
    this.unsubscribeWriteState = WriteStateStore.listen(this.writeStateChanged.bind(this));
  }

  /**
   * Unsubscribe from the stores.
   */
  componentWillUnmount() {
    this.unsubscribeWriteState();
  }

  /**
   * Determine if the application is in a writable state.
   *
   * @returns {Boolean} If the application is writable.
   */
  isWritable() {
    const isWritable = WriteStateStore.state.isWritable;
    return isWritable;
  }

  /**
   * Handle write state changes.
   *
   * @param {Object} state - The write state.
   */
  writeStateChanged(state) {
    this.setState(state);
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
    const tooltip = (this.isWritable()) ? null : (<Tooltip id={this.props.tooltipId} />);
    return (
      <div className={WRAPPER} data-tip={this.tooltipText()} data-for={this.props.tooltipId}>
        <OptionSelector
          id={this.props.id}
          label={this.props.label}
          title={this.props.title}
          bsSize={this.props.bsSize}
          options={this.props.options}
          disabled={!this.isWritable()}
          onSelect={this.props.onSelect}
          className={this.props.className}/>
        {tooltip}
      </div>
    );
  }
}

export default OptionWriteSelector;
