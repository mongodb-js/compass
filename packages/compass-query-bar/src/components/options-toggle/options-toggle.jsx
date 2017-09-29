import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';

class OptionsToggle extends PureComponent {
  static displayName = 'OptionsToggle';

  static propTypes = {
    actions: PropTypes.object.isRequired,
    className: PropTypes.string,
    expanded: PropTypes.bool.isRequired
  };

  static defaultProps = {
    className: ''
  };

  onClick = () => {
    this.props.actions.toggleQueryOptions();
  };

  render() {
    const { expanded, className } = this.props;
    const symbol = expanded ? 'caret-down' : 'caret-right';

    const _className = classnames(
      'btn',
      'btn-default',
      'btn-xs',
      'querybar-options-toggle',
      { ['querybar-options-toggle-open']: expanded },
      className
    );

    return (
      <div
        className={_className}
        onClick={this.onClick}
        data-test-id="query-bar-options-toggle">
        <FontAwesome fixedWidth name={symbol} />
        <span data-test-id="query-bar-options-toggle-text">Options</span>
      </div>
    );
  }
}

export default OptionsToggle;
export { OptionsToggle };
