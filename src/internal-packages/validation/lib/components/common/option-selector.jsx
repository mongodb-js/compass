const React = require('react');
const _ = require('lodash');
const { DropdownButton, MenuItem } = require('react-bootstrap');

// import dbg from 'debug';
// const debug = dbg('mongodb-compass:validation:action-selector');

class OptionSelector extends React.Component {


  /**
   * Render validation action selector component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const title = this.props.options[this.props.value] || '';

    const menuItems = _.map(this.props.options, (label, key) => {
      return <MenuItem key={key} eventKey={key} href="#">{label}</MenuItem>;
    });

    return (
      <div className="option-selector">
        <span>{this.props.label}</span>
        {' '}
        <DropdownButton
          bsSize={this.props.bsSize}
          id={this.props.id}
          onSelect={this.props.onSelect}
          title={title}
        >{menuItems}
        </DropdownButton>
      </div>
    );
  }
}

OptionSelector.propTypes = {
  id: React.PropTypes.string.isRequired,
  bsSize: React.PropTypes.string,
  options: React.PropTypes.object.isRequired,
  label: React.PropTypes.string,
  value: React.PropTypes.string,
  onSelect: React.PropTypes.func
};

OptionSelector.defaultProps = {
  label: '',
  value: '',
  onSelect: () => {}
};

OptionSelector.displayName = 'OptionSelector';

module.exports = OptionSelector;
