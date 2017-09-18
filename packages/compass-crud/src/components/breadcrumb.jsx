const React = require('react');
const PropTypes = require('prop-types');

class BreadcrumbComponent extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="ag-header-breadcrumb">
        <span> {this.props.ns.ns}</span>
      </div>
    );
  }
}

BreadcrumbComponent.propTypes = {
  ns: PropTypes.object
};

BreadcrumbComponent.defaultPropTypes = {
  ns: ['', '']
};

BreadcrumbComponent.displayName = 'BreadcrumbComponent';

module.exports = BreadcrumbComponent;
