require('babel-register')({ extensions: ['.jsx'] });

const React = require('react');
const ReactDOM = require('react-dom');

const CompassServerstatsComponent = require('../../lib/components');

ReactDOM.render(
  React.createElement(CompassServerstatsComponent), document.getElementById('container')
);
