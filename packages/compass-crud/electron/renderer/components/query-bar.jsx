const React = require('react');
const PropTypes = require('prop-types');

class QueryBar extends React.Component {
  render() {
    return (
      <div className="querybar-container">
        <div className="querybar-input-container">
          <div className="row">
            <div className="col-md-12" />
          </div>
        </div>
      </div>
    );
  }
}

QueryBar.propTypes = {
  filter: PropTypes.object,
  project: PropTypes.object,
  sort: PropTypes.object,
  skip: PropTypes.number,
  limit: PropTypes.number,
  sample: PropTypes.bool,

  valid: PropTypes.bool,
  filterValid: PropTypes.bool,
  projectValid: PropTypes.bool,
  sortValid: PropTypes.bool,
  skipValid: PropTypes.bool,
  limitValid: PropTypes.bool,

  autoPopulated: PropTypes.bool,
  filterString: PropTypes.string,
  projectString: PropTypes.string,
  sortString: PropTypes.string,
  skipString: PropTypes.string,
  limitString: PropTypes.string,

  actions: PropTypes.object,
  buttonLabel: PropTypes.string,
  queryState: PropTypes.string,
  layout: PropTypes.array,
  expanded: PropTypes.bool,
  lastExecutedQuery: PropTypes.object,
  onReset: PropTypes.func,
  onApply: PropTypes.func,
  schemaFields: PropTypes.object
};

QueryBar.defaultProps = {
  expanded: false,
  buttonLabel: 'Apply',
  layout: ['filter', 'project', ['sort', 'skip', 'limit']],
  schemaFields: {}
};

QueryBar.displayName = 'QueryBar';

module.exports = QueryBar;
