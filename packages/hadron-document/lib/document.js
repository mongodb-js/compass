'use strict';

const keys = require('lodash.keys');
const map = require('lodash.map');
const isObject = require('lodash.isobject');

class Element {
  get absoluteKey() {
    return this.parentElement ? `${this.parentElement.absoluteKey}.${this.key}` : this.key;
  }

  constructor(key, value, parentElement) {
    this.key = key;
    this.currentKey = key;
    this.parentElement = parentElement;

    if (isObject(value)) {
      this.value = this._sequence(value);
    } else {
      this.value = value;
      this.currentValue = value;
    }
  }

  _sequence(object) {
    return map(keys(object), (key) => {
      return new Element(key, object[key], this);
    });
  }
}

class Document {
  constructor(doc) {
    this.doc = doc;
    this.elements = this._sequence();
  }

  _sequence() {
    return map(keys(this.doc), (key) => {
      return new Element(key, this.doc[key]);
    });
  }
}

module.exports = Document;
