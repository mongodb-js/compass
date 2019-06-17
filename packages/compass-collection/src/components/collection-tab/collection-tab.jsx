import React, { PureComponent } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './collection-tab.less';

/**
 * Behaviour for the tab drag source.
 */
const tabSource = {
  beginDrag(props) {
    return {
      index: props.index
    };
  }
};

/**
 * Behaviour for the tab drop target.
 */
const tabTarget = {
  hover(props, monitor, component) {
    const fromIndex = monitor.getItem().index;
    const toIndex = props.index;

    if (fromIndex !== toIndex) {
      // Determine rectangle on screen
      const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();
      const hoverMiddleX = 100; // This is static.
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      // Dragging to the left
      if (fromIndex < toIndex && hoverClientX > hoverMiddleX) {
        return;
      }
      // Dragging to the right
      if (fromIndex > toIndex && hoverClientX < hoverMiddleX) {
        return;
      }
      props.moveTab(fromIndex, toIndex);
      // This prevents us from overloading the store with stageMoved actions.
      monitor.getItem().index = toIndex;
    }
  }
};

/**
 * Display a single stage in the aggregation pipeline.
 *
 * Decorators added for giving the component drag/drop behaviour.
 */
@DropTarget('Stage', tabTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))
@DragSource('Stage', tabSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.didDrop() ? false : monitor.isDragging()
}))
class CollectionTab extends PureComponent {
  static displayName = 'CollectionTabComponent';

  static propTypes = {
    namespace: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    closeTab: PropTypes.func.isRequired,
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    selectTab: PropTypes.func.isRequired,
    moveTab: PropTypes.func.isRequired,
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
    this.state = { subtab: 'Documents' };
    this.onSubtabChanged = this.handleSubtabChange.bind(this);
  }

  /**
   * Scroll into view on first mount if active.
   */
  componentDidMount() {
    this.scrollTab();
    this.props.localAppRegistry.on('subtab-changed', this.onSubtabChanged);
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
   * Remove app registry listeners on unmount.
   */
  compnentWillUnmount() {
    this.props.localAppRegistry.removeListener('subtab-changed', this.onSubtabChanged);
  }

  /**
   * Handle subtab changing.
   *
   * @param {String} name - The name.
   */
  handleSubtabChange(name) {
    this.setState({ subtab: name });
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

    return this.props.connectDragSource(
      this.props.connectDropTarget(
        <div ref={this.tabRef} className={tabClass}>
          <div className={classnames(styles['collection-tab-info'])} onClick={this.selectTab}>
            <div className={classnames(styles['collection-tab-info-label'])}>
              <div className={classnames(styles['collection-tab-info-ns'])}>
                {this.props.namespace}
              </div>
              {this.renderReadonly()}
            </div>
            <div className={classnames(styles['collection-tab-info-subtab'])}>
              {this.state.subtab}
            </div>
          </div>
          <div className={classnames(styles['collection-tab-close'])} onClick={this.closeTab}>
            <i className="fa fa-times" aria-hidden />
          </div>
        </div>
      )
    );
  }
}

export default CollectionTab;
