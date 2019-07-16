const React = require('react');
const PropTypes = require('prop-types');

class FormGroup extends React.PureComponent {
  getClassName() {
    let className = 'form-group';

    if (this.props.separator) {
      className = `${className} form-group-separator`;
    }

    return className;
  }

  render() {
    return (
      <div id={this.props.id} className={this.getClassName()}>
        {this.props.children}
      </div>
    );
  }
}

FormGroup.propTypes = {
  id: PropTypes.string,
  separator: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object
  ])
};

FormGroup.displayName = 'FormGroup';

module.exports = FormGroup;
