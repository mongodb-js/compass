const app = require('ampersand-app');
const React = require('react');
const _ = require('lodash');
const NativeListener = require('react-native-listener');
const hasDistinctValue = require('../../../query/lib/util').hasDistinctValue;

// const debug = require('debug')('mongodb-compass:minichart:unique');

const ValueBubble = React.createClass({
  propTypes: {
    fieldName: React.PropTypes.string.isRequired,
    value: React.PropTypes.any.isRequired,
    query: React.PropTypes.any
  },

  onBubbleClicked(e) {
    const QueryAction = app.appRegistry.getAction('QueryAction');
    const action = e.shiftKey ?
      QueryAction.toggleDistinctValue : QueryAction.setValue;
    action({
      field: this.props.fieldName,
      value: this.props.value,
      unsetIfSet: true
    });
  },

  render() {
    const value = this.props.value;
    const selectedClass = hasDistinctValue(this.props.query, value) ?
      'selected' : 'unselected';
    return (
      <li className="bubble">
        <code className={`selectable ${selectedClass}`} onClick={this.onBubbleClicked}>
          {value.toString()}
        </code>
      </li>
    );
  }
});

/* eslint react/no-multi-comp: 0 */
const UniqueMinichart = React.createClass({
  propTypes: {
    fieldName: React.PropTypes.string.isRequired,
    type: React.PropTypes.object.isRequired,
    width: React.PropTypes.number,
    query: React.PropTypes.any
  },

  getInitialState() {
    return {
      sample: _.sample(this.props.type.values, 20)
    };
  },

  onRefresh(e) {
    e.stopPropagation();
    e.preventDefault();
    this.setState({
      sample: _.sample(this.props.type.values, 20)
    });
  },

  /**
   * Render a single field;
   *
   * @returns {React.Component} A react component for a single field
   */
  render() {
    if (!this.props.type.values) {
      return <div></div>;
    }
    const sample = this.state.sample || [];
    const fieldName = this.props.fieldName.toLowerCase();
    const typeName = this.props.type.name.toLowerCase();
    const randomValueList = sample.map((value) => {
      return (
        <ValueBubble
          key={`${fieldName}-${typeName}-${value.toString()}`}
          value={value}
          query={this.props.query}
          fieldName={this.props.fieldName}
        />
      );
    });
    const style = {
      width: this.props.width
    };

    return (
      <div className="minichart unique" style={style}>
        <dl className="dl-horizontal">
          <dt>
            <NativeListener onClick={this.onRefresh}>
              <a>
                <i className="mms-icon-continuous" />
              </a>
            </NativeListener>
          </dt>
          <dd>
            <ul className="list-inline">
              {randomValueList}
            </ul>
          </dd>
        </dl>
      </div>
    );
  }
});

module.exports = UniqueMinichart;
