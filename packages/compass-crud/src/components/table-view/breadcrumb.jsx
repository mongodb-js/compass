import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@mongodb-js/compass-components';

const BEM_BASE = 'ag-header-breadcrumb';
const ICON_TYPE = { Array: '[ ]', Object: '{ }' };

class BreadcrumbComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onTabClicked = this.onTabClicked.bind(this);
  }

  onTabClicked(index) {
    this.props.pathChanged(
      this.props.path.slice(0, index + 1),
      this.props.types.slice(0, index + 1)
    );
  }

  onHomeClicked() {
    this.props.pathChanged([], []);
  }

  getPathClassName(i) {
    if (i === this.props.path.length - 1) {
      return `${BEM_BASE}-tab ${BEM_BASE}-tab-active`;
    }
    return `${BEM_BASE}-tab`;
  }

  render() {
    return (
      <div className={`${BEM_BASE}-container`}>
        <button
          type="button"
          onClick={this.onHomeClicked.bind(this)}
          className={`${BEM_BASE}-tab`}
        >
          <Icon glyph='Home' size={11} className={`${BEM_BASE}-home-icon`}></Icon>
          {this.props.collection}
        </button>
        {this.props.path.map((name, i) => {
          let displayName = '';
          if (typeof name === 'number' && i > 0) {
            displayName = this.props.path[i - 1] + '.';
          }
          displayName = displayName.concat(name);
          return (
            <button
              type="button"
              key={i}
              onClick={() => this.onTabClicked(i)}
              className={this.getPathClassName(i)}
            >
              {displayName} {ICON_TYPE[this.props.types[i]]}
            </button>
          );
        })}
      </div>
    );
  }
}

BreadcrumbComponent.propTypes = {
  collection: PropTypes.string.isRequired,
  pathChanged: PropTypes.func.isRequired,
  path: PropTypes.array.isRequired,
  types: PropTypes.array.isRequired,
};

BreadcrumbComponent.defaultPropTypes = {
  collection: '',
};

BreadcrumbComponent.displayName = 'BreadcrumbComponent';

export default BreadcrumbComponent;
