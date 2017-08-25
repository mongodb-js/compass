const React = require('react');
const PropTypes = require('prop-types');
// const util = require('util');

class CellRenderer extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <span>{this.props.data.toString()}</span>
    );
  }
}

CellRenderer.propTypes = {
  data: PropTypes.any
};

CellRenderer.displayName = 'CellRenderer';

module.exports = CellRenderer;
