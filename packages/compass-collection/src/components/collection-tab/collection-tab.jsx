import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './collection-tab.less';

/**
 * Display a single stage in the aggregation pipeline.
 *
 * Decorators added for giving the component drag/drop behaviour.
 */
class CollectionTab extends PureComponent {
  static displayName = 'CollectionTabComponent';

  static propTypes = {
    namespace: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    closeTab: PropTypes.func.isRequired,
    selectTab: PropTypes.func.isRequired,
    moveTab: PropTypes.func.isRequired,
    activeSubTabName: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    localAppRegistry: PropTypes.object.isRequired
  };

  /**
   * Instantiate the tab.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.tabRef = React.createRef();
  }

  /**
   * Scroll into view on first mount if active.
   */
  componentDidMount() {
    this.scrollTab();
  }

  /**
   * Scroll into view if tab was activated.
   *
   * @param {Object} prevProps - The previous props.
   */
  componentDidUpdate(prevProps) {
    if (!prevProps.isActive) {
      this.scrollTab();
    }
  }

  /**
   * Close the tab.
   */
  closeTab = () => {
    this.props.closeTab(this.props.index);
  }

  /**
   * Select the tab.
   */
  selectTab = () => {
    this.props.selectTab(this.props.index);
  }

  /**
   * Scroll this tab into view.
   */
  scrollTab = () => {
    if (this.props.isActive && this.tabRef.current.scrollIntoView) {
      this.tabRef.current.scrollIntoView();
    }
  }

  renderReadonly() {
    if (this.props.isReadonly) {
      return (
        <div className={classnames(styles['collection-tab-info-readonly'])}>
          <i
            className={classnames('fa', styles['collection-tab-info-view-icon'])}
            title="Read-only View"
            aria-hidden="true" />
        </div>
      );
    }
  }

  /**
   * Render the Collection Tab component.
   *
   * @returns {Component} The rendered component.
   */
  render() {
    const tabClass = classnames({
      [styles['collection-tab']]: true,
      [styles['collection-tab-is-active']]: this.props.isActive
    });

    return (<div ref={this.tabRef} className={tabClass}>
      <div className={classnames(styles['collection-tab-info'])} onClick={this.selectTab}>
        <div className={classnames(styles['collection-tab-info-label'])}>
          <div className={classnames(styles['collection-tab-info-ns'])}>
            {this.props.namespace}
          </div>
          {this.renderReadonly()}
        </div>
        <div className={classnames(styles['collection-tab-info-subtab'])}>
          {this.props.activeSubTabName}
        </div>
      </div>
      <div className={classnames(styles['collection-tab-close'])} onClick={this.closeTab}>
        <i className="fa fa-times" aria-hidden />
      </div>
    </div>);
  }
}

export default CollectionTab;
