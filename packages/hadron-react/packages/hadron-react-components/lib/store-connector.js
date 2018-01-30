'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var isFunction = require('lodash.isfunction');

/**
 * Connects a store to a component where the store state matches
 * the component state.
 */

var StoreConnector = function (_React$Component) {
  _inherits(StoreConnector, _React$Component);

  function StoreConnector(props) {
    _classCallCheck(this, StoreConnector);

    // warn if the store does not have a getInitialState() method
    var _this = _possibleConstructorReturn(this, (StoreConnector.__proto__ || Object.getPrototypeOf(StoreConnector)).call(this, props));

    if (!isFunction(props.store.getInitialState)) {
      /* eslint no-console: 0 */
      console.warn('component ' + _this.constructor.displayName + ' is trying to connect to a store that lacks a "getInitialState()" method');
      _this.state = {};
    } else {
      _this.state = props.store.state;
    }
    return _this;
  }

  /**
   * subscribe to changes from the store.
   */


  _createClass(StoreConnector, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.unsubscribe = this.props.store.listen(this.setState.bind(this));
    }

    /**
     * unsubscribe from changes to the store.
     */

  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.unsubscribe();
    }

    /**
     * render a shallow clone of the children and pass in the state as props.
     *
     * @return {React.Element}  shallow clone of the child element.
     */

  }, {
    key: 'render',
    value: function render() {
      return React.cloneElement(this.props.children, this.state);
    }
  }]);

  return StoreConnector;
}(React.Component);

StoreConnector.propTypes = {
  store: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired
};

StoreConnector.displayName = 'StoreConnector';

module.exports = StoreConnector;