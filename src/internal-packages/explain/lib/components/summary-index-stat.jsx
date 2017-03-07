const React = require('react');
const FontAwesome = require('react-fontawesome');
const app = require('hadron-app');
const shell = require('electron').shell;
// const debug = require('debug')('mongodb-compass:explain:summary-index-stat');

/**
 * React component that displays information about the index used for the
 * given query, if any.
 */
class SummaryIndexStat extends React.Component {

  componentWillMount() {
    this.indexComponent = app.appRegistry.getComponent('Indexes.IndexDefinitionType');
  }

  onHelpClicked(explainURL) {
    shell.openExternal(explainURL);
  }

  getIndexMessageText() {
    const typeToMessage = {
      COLLSCAN: 'No index available for this query.',
      COVERED: 'Query covered by index:',
      MULTIPLE: 'Shard results differ (see details below)',
      INDEX: 'Query used the following index:'
    };

    return typeToMessage[this.props.indexType];
  }

  getIndexMessageIcon() {
    const greenCheckMark = <FontAwesome fixedWidth style={{color: '#507b32'}} name="check-circle" />;
    const yellowWarning = <FontAwesome fixedWidth style={{color: '#fbb129'}} name="exclamation-triangle" />;

    const typeToIcon = {
      COLLSCAN: yellowWarning,
      COVERED: greenCheckMark,
      MULTIPLE: yellowWarning,
      INDEX: null,
      UNAVAILABLE: null
    };
    return typeToIcon[this.props.indexType];
  }

  getIndexMessageColor() {
    const typeToColor = {
      COLLSCAN: '#7F6A4E',
      COVERED: '#507b32',
      MULTIPLE: '#7F6A4E',
      INDEX: '#000',
      UNAVAILABLE: '#000'
    };
    return typeToColor[this.props.indexType];
  }

  renderIndexDefinition() {
    if (this.props.index) {
      return <this.indexComponent index={this.props.index} dataTestId={this.props.dataTestId}/>;
    }
    return null;
  }

  /**
   * Render summary stat for index usage.
   *
   * @returns {React.Component}   Index usage stat component.
   */
  render() {
    const dataLink = this.props.dataLink;
    return (
      <div className="summary-stat summary-stat-is-index">
        <i className="summary-stat-info-sprinkle" onClick={this.onHelpClicked.bind(this, dataLink)} data-link={dataLink}></i>
        <span>
          <span className="summary-stat-index-icon">{this.getIndexMessageIcon()}</span>
          <span
            className="summary-stat-index-message"
            style={{color: this.getIndexMessageColor()}}
          >{this.getIndexMessageText()}</span>
        </span>
        {this.renderIndexDefinition()}
      </div>
    );
  }
}

SummaryIndexStat.propTypes = {
  dataLink: React.PropTypes.string,          // info sprinkle (optional)
  indexType: React.PropTypes.oneOf(['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN',
    'COVERED', 'INDEX']).isRequired,
  index: React.PropTypes.object,
  dataTestId: React.PropTypes.string
};

SummaryIndexStat.displayName = 'SummaryIndexStat';

module.exports = SummaryIndexStat;
