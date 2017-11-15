const React = require('react');
const PropTypes = require('prop-types');
const FontAwesome = require('react-fontawesome');

const Actions = require('../actions');
const BreadcrumbStore = require('../stores/breadcrumb-store');

const BEM_BASE = 'ag-header-breadcrumb';
const ICON_TYPE = {Array: '[ ]', Object: '{ }' };

class BreadcrumbComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = { path: [], types: [], collection: props.collection };
    this.onTabClicked = this.onTabClicked.bind(this);
  }

  componentDidMount() {
    this.unsubscribeBreadcrumbStore = BreadcrumbStore.listen(this.breadcrumbStoreChanged.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeBreadcrumbStore();
  }

  onTabClicked(index) {
    this.props.actions.pathChanged(
      this.state.path.slice(0, index + 1),
      this.state.types.slice(0, index + 1)
    );
  }

  onHomeClicked() {
    this.state.path = [];
    this.state.types = [];
    this.props.actions.pathChanged([], []);
  }

  /**
   * When the BreadcrumbStore changes, update the state.
   *
   * @param {Object} params - Can contain collection, path, and/or types.
   *  collection {String} - The collection name.
   *  path {Array} - The array of field names/indexes.
   *  types {Array} - The array of types for each segment of the path array.
   */
  breadcrumbStoreChanged(params) {
    this.setState(params);
  }

  render() {
    return (
      <div className={`${BEM_BASE}-container`}>
        <div onClick={this.onHomeClicked.bind(this)} className={`${BEM_BASE}-tab`}>
          <FontAwesome name="home" className={`${BEM_BASE}-home-icon`}/>
          {this.state.collection}
        </div>
        {this.state.path.map((name, i) => {
          let displayName = '';
          if (typeof name === 'number' && i > 0) {
            displayName = this.state.path[i - 1] + '.';
          }
          displayName = displayName.concat(name);
          const className = (i === this.state.path.length - 1) ? `${BEM_BASE}-tab ${BEM_BASE}-tab-active` : `${BEM_BASE}-tab`;
          return <span key={i} onClick={() => this.onTabClicked(i)} className={className}>{displayName} {ICON_TYPE[this.state.types[i]]}</span>;
        })}
      </div>
    );
  }
}

BreadcrumbComponent.propTypes = {
  collection: PropTypes.string.isRequired,
  actions: PropTypes.any.isRequired
};

BreadcrumbComponent.defaultPropTypes = {
  collection: '',
  actions: Actions
};

BreadcrumbComponent.displayName = 'BreadcrumbComponent';

module.exports = BreadcrumbComponent;
