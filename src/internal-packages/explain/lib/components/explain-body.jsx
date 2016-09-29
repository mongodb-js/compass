const React = require('react');
const ExplainJSON = require('./explain-json');
const ExplainTree = require('./explain-tree');

// const debug = require('debug')('mongodb-compass:explain:summary');


class ExplainBody extends React.Component {

  /**
   * Render Summary Component.
   *
   * @returns {React.Component} The Summary part of the explain view.
   */
  render() {
    const DetailsViewClass = this.props.viewType === 'json' ? ExplainJSON : ExplainTree;
    const detailsView = <DetailsViewClass rawExplainObject={this.props.rawExplainObject} />;

    return (
      <div className="explain-body">
        {detailsView}
      </div>
    );
  }
}

ExplainBody.propTypes = {
  viewType: React.PropTypes.oneOf(['tree', 'json']),
  rawExplainObject: React.PropTypes.object.isRequired
};

ExplainBody.displayName = 'ExplainBody';

module.exports = ExplainBody;
