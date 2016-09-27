'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (store, key) {
  var noKey = key === undefined;

  return function (Component) {
    //if no explicit state declaration in 'constructor'
    Component.prototype.state = {};

    return function (_React$Component) {
      _inherits(ConnectorWrapper, _React$Component);

      function ConnectorWrapper() {
        _classCallCheck(this, ConnectorWrapper);

        return _possibleConstructorReturn(this, (ConnectorWrapper.__proto__ || Object.getPrototypeOf(ConnectorWrapper)).apply(this, arguments));
      }

      _createClass(ConnectorWrapper, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
          var findInnerComponent = function findInnerComponent(instance) {
            //recursively find inner most 'real react component', allowing multiple decorators
            if (instance.refs[componentRef]) {
              return findInnerComponent(instance.refs[componentRef]);
            }
            return instance;
          };
          var componentInstance = findInnerComponent(this.refs[componentRef]);

          var setStateFunc = function setStateFunc(state) {
            var newState = noKey ? state : (0, _utils.object)([key], [state]);
            componentInstance.setState(newState);
          };

          //setting `initialState` after Component's constructor method (where: `state={...}`)
          if (!(0, _utils.isFunction)(store.getInitialState)) {
            console.warn('component ' + Component.name + ' is trying to connect to a store that lacks "getInitialState()" method');
            return;
          } else {
            var state = noKey ? store.state : store.state[key];
            setStateFunc(state);
          }

          var listener = noKey ? store : store[key];

          this.unsubscribe = listener.listen(setStateFunc);
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          this.unsubscribe();
        }
      }, {
        key: 'render',
        value: function render() {
          return _react2.default.createElement(Component, _extends({
            ref: componentRef
          }, this.props));
        }
      }]);

      return ConnectorWrapper;
    }(_react2.default.Component);
  };
};

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _utils = require('./utils.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var componentRef = '__CONNECTED_COMPONENT_REF__';