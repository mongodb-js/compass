const React = require('react');
const ReactTooltip = require('react-tooltip');
const PropTypes = require('prop-types');
const { shell } = require('electron');

class FormItemInput extends React.Component {

  getClassName() {
    const className = 'form-item';
    if (this.props.error) {
      return `${className} form-item-has-error`;
    }
    return className;
  }

  getErrorId() {
    return `form-error-tooltip-${this.props.name}`;
  }

  openLink() {
    shell.openExternal(this.props.link);
  }

  renderInfoSprinkle() {
    if (this.props.link) {
      return (
        <i className="help" onClick={this.openLink.bind(this)} />
      );
    }
  }

  renderError() {
    if (this.props.error) {
      return (
        <i className="fa fa-exclamation-circle" aria-hidden="true" />
      );
    }
  }

  renderErrorTooltip() {
    if (this.props.error) {
      return (
        <ReactTooltip id={this.getErrorId()} />
      );
    }
  }

  render() {
    const tooltipOptions = this.props.error ? {
      'data-for': this.getErrorId(),
      'data-effect': 'solid',
      'data-place': 'bottom',
      'data-offset': "{'bottom': -2}",
      'data-tip': this.props.error,
      'data-type': 'error'
    } : {};
    return (
      <div className={this.getClassName()}>
        <label>
          <span className="form-item-label">
            {this.renderError()}
            {this.props.label}
          </span>
          {this.renderInfoSprinkle()}
        </label>
        <input
          name={this.props.name}
          placeholder={this.props.placeholder}
          onChange={this.props.changeHandler}
          onBlur={this.props.blurHandler}
          value={this.props.value}
          className="form-control"
          type={this.props.type || 'text'}
          {...tooltipOptions} />
        {this.renderErrorTooltip()}
      </div>
    );
  }
}

FormItemInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  changeHandler: PropTypes.func.isRequired,
  blurHandler: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
  type: PropTypes.string,
  link: PropTypes.string,
  error: PropTypes.string
};

FormItemInput.displayName = 'FormItemInput';

module.exports = FormItemInput;
