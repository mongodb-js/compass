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
   * When clicking on a hotspot we append or remove on the parent.
   */
  handleClick() {
    this.element.next();
  }

  /**
   * Get the last element for the base element.
   *
   * @param {Element} baseElement - The base element.
   *
   * @returns {Element} The last element.
   */
  lastElement(baseElement) {
    return baseElement.elements[baseElement.elements.length - 1];
  }

  /**
   * Is the element removable?
   *
   * @param {Element} element - The element.
   *
   * @returns {Boolean} if the element must be removed.
   */
  isRemovable(element) {
    if (element.parentElement && element.parentElement.type === 'Array') {
      return element.currentValue === '';
    }
    return element.isBlank();
  }

  /**
   * Is the element actionable.
   *
   * @param {Element} element - If the element is actionable.
   *
   * @returns {Boolean} If the element is actionable.
   */
  isActionable(element) {
    return element.currentKey !== '' || element.currentValue !== '';
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
