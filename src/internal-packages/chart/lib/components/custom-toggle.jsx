const React = require('react');

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
  onClick: React.PropTypes.func,
  className: React.PropTypes.string,
  children: React.PropTypes.node
};

module.exports = CustomToggle;
