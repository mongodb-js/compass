'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var omit = require('lodash.omit');
var keys = require('lodash.keys');
var React = require('react');
var ReactDOM = require('react-dom');
var PropTypes = require('prop-types');

var UnsafeComponent = function (_React$Component) {
  _inherits(UnsafeComponent, _React$Component);

  function UnsafeComponent() {
    _classCallCheck(this, UnsafeComponent);

    return _possibleConstructorReturn(this, (UnsafeComponent.__proto__ || Object.getPrototypeOf(UnsafeComponent)).apply(this, arguments));
  }

  _createClass(UnsafeComponent, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.renderInjected();
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this.renderInjected();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.unmountInjected();
    }
  }, {
    key: 'unmountInjected',
    value: function unmountInjected() {
      try {
        var node = ReactDOM.findDOMNode(this);
        ReactDOM.unmountComponentAtNode(node);
      } catch (error) {
        /* eslint no-console:0 */
        console.log(error);
      }
    }
  }, {
    key: 'renderLargeRole',
    value: function renderLargeRole(stack) {
      return React.createElement(
        'div',
        { className: 'unsafe-component-has-error' },
        React.createElement(
          'div',
          { className: 'unsafe-component-message' },
          React.createElement('i', { className: 'fa fa-exclamation-circle' }),
          this.props.component.displayName,
          ' could not be displayed.'
        ),
        React.createElement(
          'div',
          { className: 'unsafe-component-stack' },
          stack
        )
      );
    }
  }, {
    key: 'renderInjected',
    value: function renderInjected() {
      var element = void 0;
      var node = ReactDOM.findDOMNode(this);
      try {
        var props = omit(this.props, keys(this.constructor.propTypes));
        element = React.createElement(this.props.component, _extends({ key: name }, props));
        this.injected = ReactDOM.render(element, node);
      } catch (error) {
        var stack = error.stack;
        if (stack) {
          var stackEnd = stack.indexOf('/react/');
          if (stackEnd > 0) {
            stackEnd = stack.lastIndexOf('\n', stackEnd);
            stack = stack.substr(0, stackEnd);
          }
        }
        element = this.renderLargeRole(stack);
      }
      this.injected = ReactDOM.render(element, node);
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement('div', { className: 'unsafe-component' });
    }
  }]);

  return UnsafeComponent;
}(React.Component);

UnsafeComponent.propTypes = {
  component: PropTypes.func.isRequired
};

UnsafeComponent.displayName = 'UnsafeComponent';

module.exports = UnsafeComponent;