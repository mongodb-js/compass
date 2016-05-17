'use strict';

const moment = require('moment');
const React = require('react');
const Element = require('../element');

/**
 * Component for date types.
 */
class DateElement extends React.Component {

  /**
   * Render a date element.
   */
  render() {
    var date = moment(this.props.value).format('LLL');
    return (
      <Element field={this.props.field} value={date} type={this.props.type} />
    );
  }
}

DateElement.displayName = 'DateElement';

module.exports = DateElement;
