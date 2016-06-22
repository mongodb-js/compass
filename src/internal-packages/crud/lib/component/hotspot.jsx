'use strict';

const React = require('react');

/**
 * Component for add element hotspot.
 */
class Hotspot extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
  }

  /**
   * When clicking on a hotspot we append to the parent.
   */
  handleClick() {
    this.element.next();
  }

  /**
   * Render the hotspot.
   *
   * @returns {Component} The hotspot component.
   */
  render() {
    return (
      <div className='hotspot' onClick={this.handleClick.bind(this)}></div>
    );
  }
}

Hotspot.displayName = 'Hotspot';

module.exports = Hotspot;
