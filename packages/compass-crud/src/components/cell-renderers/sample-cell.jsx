const React = require('react');
const PropTypes = require('prop-types');

class SampleCellRenderer extends React.Component {

  constructor(props) {
    super(props);
    // console.log('The value is ' + props.value);
    props.api.selectAll();
  }

  render() {
    return <span>VALUE: {this.props.value}</span>;
  }
}

SampleCellRenderer.propTypes = {
  api: PropTypes.any,
  value: PropTypes.any
};

SampleCellRenderer.displayName = 'SampleCellRenderer';

module.exports = SampleCellRenderer;
