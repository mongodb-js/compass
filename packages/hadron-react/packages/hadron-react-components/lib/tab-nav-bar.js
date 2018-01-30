'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var map = require('lodash.map');

/**
 * Represents tabbed navigation with a tabbed header and content.
 */

var TabNavBar = function (_React$Component) {
  _inherits(TabNavBar, _React$Component);

  /**
   * Instantiate the tab nav bar.
   *
   * @param {Object} props - The props.
   */
  function TabNavBar(props) {
    _classCallCheck(this, TabNavBar);

    var _this = _possibleConstructorReturn(this, (TabNavBar.__proto__ || Object.getPrototypeOf(TabNavBar)).call(this, props));

    _this.state = {
      paused: false,
      activeTabIndex: props.activeTabIndex || 0
    };
    return _this;
  }

  /**
   * Handle component receiving new props.
   *
   * @param {Object} nextProps - The new props.
   */


  _createClass(TabNavBar, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (nextProps.activeTabIndex !== undefined) {
        this.setState({
          activeTabIndex: nextProps.activeTabIndex
        });
      }
    }

    /**
     * Handle a tab being clicked.
     *
     * @param {Number} idx - The tab index.
     * @param {Event} evt - The event.
     */

  }, {
    key: 'onTabClicked',
    value: function onTabClicked(idx, evt) {
      evt.preventDefault();
      this.setState({ activeTabIndex: idx });
      if (this.props.onTabClicked) {
        this.props.onTabClicked(idx, this.props.tabs[idx]);
      }
    }

    /**
     * Render the tabs.
     *
     * @returns {React.Component} The tabs.
     */

  }, {
    key: 'renderTabs',
    value: function renderTabs() {
      var _this2 = this;

      var listItems = map(this.props.tabs, function (tab, idx) {
        return React.createElement(
          'li',
          { onClick: _this2.onTabClicked.bind(_this2, idx),
            id: tab.replace(/ /g, '_'),
            key: 'tab-' + idx,
            'data-test-id': tab.toLowerCase().replace(/ /g, '-') + '-tab',
            className: 'tab-nav-bar tab-nav-bar-tab ' + (idx === _this2.state.activeTabIndex ? 'tab-nav-bar-is-selected' : '') },
          React.createElement(
            'span',
            { className: 'tab-nav-bar tab-nav-bar-link', href: '#' },
            tab
          )
        );
      });
      return React.createElement(
        'ul',
        { className: 'tab-nav-bar tab-nav-bar-tabs' },
        listItems
      );
    }

    /**
     * Only render the active view, mounting it and unmounting all non-active views.
     *
     * @return {React.Element}    active view
     */

  }, {
    key: 'renderActiveView',
    value: function renderActiveView() {
      return this.props.views[this.state.activeTabIndex];
    }

    /**
     * Render all views, but only make the active view visible. This is done
     * by wrapping all views in their own div, and setting the `hidden` class
     * on all but the active div.
     *
     * @return {React.Element}    div of all views
     */

  }, {
    key: 'renderViews',
    value: function renderViews() {
      var _this3 = this;

      var tabbedViews = map(this.props.views, function (view, idx) {
        return React.createElement(
          'div',
          {
            key: 'tab-content-' + idx,
            'data-test-id': _this3.props.tabs[idx].toLowerCase().replace(/ /g, '-') + '-content',
            className: idx === _this3.state.activeTabIndex ? 'tab' : 'tab hidden' },
          view
        );
      });

      return React.createElement(
        'div',
        { className: 'tab-views' },
        tabbedViews
      );
    }

    /**
     * Render the component.
     *
     * @returns {React.Component} The component.
     */

  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { className: 'tab-nav-bar tab-nav-bar-is-' + this.props.theme + '-theme' },
        React.createElement(
          'div',
          { className: 'tab-nav-bar tab-nav-bar-header' },
          this.renderTabs()
        ),
        this.props.mountAllViews ? this.renderViews() : this.renderActiveView()
      );
    }
  }]);

  return TabNavBar;
}(React.Component);

TabNavBar.propTypes = {
  theme: PropTypes.oneOf(['dark', 'light']),
  activeTabIndex: PropTypes.number,
  mountAllViews: PropTypes.bool,
  tabs: PropTypes.arrayOf(PropTypes.string).isRequired,
  views: PropTypes.arrayOf(PropTypes.element).isRequired,
  onTabClicked: PropTypes.func
};

TabNavBar.defaultProps = {
  theme: 'light',
  activeTabIndex: 0,
  mountAllViews: true
};

TabNavBar.displayName = 'TabNavBar';

module.exports = TabNavBar;