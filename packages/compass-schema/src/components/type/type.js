import React, { Component } from 'react';
import PropTypes from 'prop-types';
import sortBy from 'lodash.sortby';
import find from 'lodash.find';
import numeral from 'numeral';
import ReactTooltip from 'react-tooltip';
import TOOLTIP_IDS from 'constants/schema';

// const debug = require('debug')('mongodb-compass:schema:type');

/**
 * The full schema component class.
 */
const TYPE_CLASS = 'schema-field-wrapper';

/**
 * Component for the entire document list.
 */
class Type extends Component {
  static displayName = 'TypeComponent';

  static propTypes = {
    name: PropTypes.string.isRequired,
    types: PropTypes.array,
    activeType: PropTypes.any,
    self: PropTypes.object,
    probability: PropTypes.number.isRequired,
    renderType: PropTypes.func.isRequired,
    showSubTypes: PropTypes.bool.isRequired
  }

  /**
   * The type bar corresponding to this Type was clicked. Execute the
   * callback passed in from the parent (either <Field> or <Type> component
   * in case of subtypes).
   *
   * @param  {Object} e    click event (need to stop propagation)
   */
  typeClicked(e) {
    e.stopPropagation();
    this.props.renderType(this.props.self);
  }

  /**
   * A subtype was clicked (in case of an Array type). Pass up to the Field
   * so the entire type bar can be re-rendered.
   *
   * @param  {Object} subtype   The subtype object
   */
  subTypeClicked(subtype) {
    this.props.renderType(subtype);
  }

  /**
   * returns a list of subtype components for Array types.
   *
   * @return {ReactFragment}   array of <Type> components for subtype bar
   */
  _getArraySubTypes() {
    // only worry about subtypes if the type is Array
    if (this.props.name !== 'Array') {
      return null;
    }
    // only show one level of subtypes, further Arrays inside Arrays don't
    // render their subtypes.
    if (!this.props.showSubTypes) {
      return null;
    }
    // sort the subtypes same as types (by probability, undefined last)
    const subtypes = sortBy(this.props.types, (type) => {
      if (type.name === 'Undefined') {
        return -Infinity;
      }
      return type.probability;
    }).reverse();
    // is one of the subtypes active?
    const activeSubType = find(subtypes, this.props.activeType);
    // generate the react fragment of subtypes, pass in showSubTypes=false
    // to stop the recursion after one step.
    const typeList = subtypes.map((subtype) => {
      return (
        <Type
          key={'subtype-' + subtype.name}
          activeType={activeSubType}
          renderType={this.subTypeClicked.bind(this, subtype)}
          self={subtype}
          showSubTypes={false}
          {...subtype}
        />
      );
    });
    return (
      <div className="array-subtypes">
        <div className="schema-field-type-list">
          {typeList}
        </div>
      </div>
    );
  }

  /**
   * Render a single type
   *
   * @returns {React.Component}   A react component for a single type,
   * possibly with subtypes included for Array type.
   */
  render() {
    const type = this.props.name.toLowerCase();
    let cls = `${TYPE_CLASS} schema-field-type-${type}`;
    if (this.props.activeType === this.props.self) {
      cls += ' active';
    }
    const handleClick = type === 'undefined' ? null : this.typeClicked.bind(this);
    const percentage = (this.props.probability * 100) + '%';
    const style = {
      width: percentage
    };
    const subtypes = this._getArraySubTypes();
    const label = <span className="schema-field-type-label">{this.props.name}</span>;
    // show integer accuracy by default, but show one decimal point accuracy
    // when less than 1% or greater than 99% but no 0% or 100%
    const format = (this.props.probability > 0.99 && this.props.probability < 1.0)
      || (this.props.probability > 0 && this.props.probability < 0.01) ? '0.0%' : '0%';
    const tooltipText = `${this.props.name} (${numeral(this.props.probability).format(format)})`;
    const tooltipOptions = {
      'data-for': TOOLTIP_IDS.SCHEMA_PROBABILITY_PERCENT,
      'data-tip': tooltipText,
      'data-effect': 'solid',
      'data-border': true
    };
    tooltipOptions['data-offset'] = this.props.showSubTypes ?
      '{"top": -25, "left": 0}' : '{"top": 10, "left": 0}';
    return (
      <div {...tooltipOptions} className={cls} style={style} onClick={handleClick}>
        <ReactTooltip id={TOOLTIP_IDS.SCHEMA_PROBABILITY_PERCENT}/>
        {this.props.showSubTypes ? label : null}
        <div className="schema-field-type"></div>
        {subtypes}
        {this.props.showSubTypes ? null : label}
      </div>
    );
  }
}

export default Type;
