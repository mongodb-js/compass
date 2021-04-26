import omit from 'lodash.omit';
import keys from 'lodash.keys';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

class UnsafeComponent extends React.Component {

  componentDidMount() {
    this.renderInjected();
  }

  componentDidUpdate() {
    this.renderInjected();
  }

  componentWillUnmount() {
    this.unmountInjected();
  }

  unmountInjected() {
    try {
      const node = ReactDOM.findDOMNode(this);
      ReactDOM.unmountComponentAtNode(node);
    } catch (error) {
      /* eslint no-console:0 */
      console.log(error);
    }
  }

  renderLargeRole(stack) {
    return (
      <div className="unsafe-component-has-error">
        <div className="unsafe-component-message">
          <i className="fa fa-exclamation-circle" />
          {this.props.component.displayName} could not be displayed.
        </div>
        <div className="unsafe-component-stack">{stack}</div>
      </div>
    );
  }

  renderInjected() {
    let element;
    const node = ReactDOM.findDOMNode(this);
    try {
      const props = omit(this.props, keys(this.constructor.propTypes));
      element = (<this.props.component key={name} {...props} />);
      this.injected = ReactDOM.render(element, node);
    } catch (error) {
      let stack = error.stack;
      if (stack) {
        let stackEnd = stack.indexOf('/react/');
        if (stackEnd > 0) {
          stackEnd = stack.lastIndexOf('\n', stackEnd);
          stack = stack.substr(0, stackEnd);
        }
      }
      element = this.renderLargeRole(stack);
    }
    this.injected = ReactDOM.render(element, node);
  }

  render() {
    return (
      <div className="unsafe-component">
      </div>
    );
  }
}

UnsafeComponent.propTypes = {
  component: PropTypes.func.isRequired
};

UnsafeComponent.displayName = 'UnsafeComponent';

export default UnsafeComponent;
