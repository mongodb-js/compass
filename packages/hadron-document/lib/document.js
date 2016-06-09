'use strict';

const keys = require('lodash.keys');
const map = require('lodash.map');
const isObject = require('lodash.isobject');

class Document {
  constructor(doc) {
    this.doc = doc;
    this.elements = new ElementFactory().sequence(doc);
  }
}

class Element {
  get absoluteKey() {
    return this.parentElement ? `${this.parentElement.absoluteKey}.${this.key}` : this.key;
  }

  constructor(key, value, parentElement) {
    this.key = key;
    this.currentKey = key;
    this.parentElement = parentElement;

    if (isObject(value)) {
      this.value = new ElementFactory().sequence(value, this);
      // Need to figure out for revert.
    } else {
      this.value = value;
      this.currentValue = value;
    }
  }
}

class ElementFactory {
  sequence(object, parentElement) {
    return map(keys(object), (key) => {
      return new Element(key, object[key], parentElement);
    });
  }
}

module.exports = Document;
