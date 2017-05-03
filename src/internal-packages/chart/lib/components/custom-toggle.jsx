const React = require('react');
const PropTypes = require('prop-types');

class CustomToggle extends React.Component {
  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.props.onClick) {
      this.props.onClick(e);
    }
  }
  render() {
    return (
      <div className={this.props.className} onClick={this.handleClick.bind(this)}>
        {this.props.children}
      </div>
    );
  }
}

CustomToggle.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node
};

module.exports = CustomToggle;
