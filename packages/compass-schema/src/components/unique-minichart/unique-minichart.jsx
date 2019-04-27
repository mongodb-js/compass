import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ValueBubble from 'components/value-bubble';
import _ from 'lodash';

class UniqueMiniChart extends Component {
  static displayName = 'UniqueMiniChartComponent';

  static propTypes = {
    fieldName: PropTypes.string.isRequired,
    queryValue: PropTypes.string,
    type: PropTypes.object.isRequired,
    width: PropTypes.number
  }

  constructor(props) {
    super(props);
    this.state = { sample: _.sample(this.props.type.values, 20) };
  }

  onRefresh(e) {
    e.stopPropagation();
    e.preventDefault();
    this.setState({
      sample: _.sample(this.props.type.values, 20)
    });
  }

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
    const randomValueList = sample.map((value, i) => {
      return (
        <ValueBubble
          key={`${fieldName}-${typeName}-${i}`}
          value={value}
          queryValue={this.props.queryValue}
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
            <i onClick={this.onRefresh.bind(this)} className="mms-icon-continuous" />
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
}

export default UniqueMiniChart;
