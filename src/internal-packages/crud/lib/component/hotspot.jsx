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
    this.doc = props.doc;
    this.element = props.element;
  }

  /**
   * When clicking on a hotspot we append to the parent.
   */
  handleClick() {
    if (this.element && this.element.parentElement) {
      this.element.next();
    } else {
      this.doc.add('', '');
    }
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

  /**
   * Never needs to re-render.
   */
  shouldComponentUpdate() {
    return false;
  }
}

Hotspot.displayName = 'Hotspot';

module.exports = Hotspot;
