import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FontAwesome from 'react-fontawesome';
import classnames from 'classnames';

import styles from './summary-index-stat.less';

/**
 * Index types.
 */
const INDEX_TYPES = ['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN', 'COVERED', 'INDEX'];

/**
 * The SummaryIndexStat component.
 */
class SummaryIndexStat extends Component {
  static displayName = 'SummaryIndexStatComponent';

  static propTypes = {
    dataLink: PropTypes.string, // Info sprinkle (optional)
    indexType: PropTypes.oneOf(INDEX_TYPES).isRequired,
    index: PropTypes.object,
    openLink: PropTypes.func.isRequired,
    appRegistry: PropTypes.object
  }

  componentWillMount() {
    this.indexComponent = this.props.appRegistry.getComponent('Indexes.IndexDefinitionType');
  }

  /**
   * Returns the message.
   *
   * @returns {String} The message.
   */
  getIndexMessageText() {
    const typeToMessage = {
      COLLSCAN: 'No index available for this query.',
      COVERED: 'Query covered by index:',
      MULTIPLE: 'Shard results differ (see details below)',
      INDEX: 'Query used the following index:'
    };

    return typeToMessage[this.props.indexType];
  }

  /**
   * Returns the index icon.
   *
   * @returns {String} The index icon.
   */
  getIndexMessageIcon() {
    const greenCheckMark = (
      <FontAwesome
        fixedWidth
        style={{color: '#507b32'}}
        name="check-circle" />
    );
    const yellowWarning = (
      <FontAwesome
        fixedWidth
        style={{color: '#fbb129'}}
        name="exclamation-triangle" />
    );
    const typeToIcon = {
      COLLSCAN: yellowWarning,
      COVERED: greenCheckMark,
      MULTIPLE: yellowWarning,
      INDEX: null,
      UNAVAILABLE: null
    };

    return typeToIcon[this.props.indexType];
  }

  /**
   * Returns the hex color.
   *
   * @returns {String} The hex color.
   */
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

  /**
   * Returns index component.
   *
   * @returns {React.Component} The rendered component.
   */
  renderIndexDefinition() {
    if (this.props.index) {
      return (<this.indexComponent />);
    }

    return null;
  }

  /**
   * Renders SummaryIndexStat component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const dataLink = this.props.dataLink;

    return (
      <div className={classnames(
        styles['summary-index-stat'],
        styles['summary-stat-is-index']
      )}>
        <i
          className={classnames(styles['summary-index-stat-info-sprinkle'])}
          onClick={this.props.openLink.bind(this, dataLink)}
        ></i>
        <span>
          <span className={classnames(styles['summary-index-stat-index-icon'])}>
            {this.getIndexMessageIcon()}
          </span>
          <span
            className={classnames(styles['summary-index-stat-index-message'])}
            style={{color: this.getIndexMessageColor()}}
          >
            {this.getIndexMessageText()}
          </span>
        </span>
        {this.renderIndexDefinition()}
      </div>
    );
  }
}

export default SummaryIndexStat;
