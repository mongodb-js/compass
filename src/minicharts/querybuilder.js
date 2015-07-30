var _ = require('lodash');
var debug = require('debug')('scout:minicharts:index');

var LeafValue = require('mongodb-language-model').LeafValue;
var ListOperator = require('mongodb-language-model').ListOperator;
var Range = require('mongodb-language-model').helpers.Range;

var MODIFIERKEY = 'shiftKey';

module.exports = {
  /**
   * Extract the range value, based on the type
   * @param  {Object} data   event information triggered by the minichart
   * @return {Any}           value to be extracted to build query
   */
  _extractRangeValue: function(data) {
    switch (this.model.getType()) {
      case 'Number':
        return data.d.x;
      case 'ObjectID':
        debug(data.d);
        return data.d.getTimestamp();
      case 'Date':
        return data.d;
      default:
        break;
    }
  },
  /**
   * Extract the distinct value, based on the type
   * @param  {Object} data   event information triggered by the minichart
   * @return {Any}           value to be extracted to build query
   */
  _extractDistinctValue: function(data) {
    // extract value
    var value = data.d.label;
    if (this.model.getType() === 'Boolean') {
      value = value === 'true';
    } else if (this.model.getType() === 'Number') {
      value = parseFloat(value, 10);
    }
    return value;
  },

  /**
   * Handler for query builder events that result in distinct selection, e.g. string and unique
   * type. Single click selects individual element, shift-click adds to selection.
   * @param  {Object} data   the contains information about the event, @see handleQueryBuilderEvent
   */
  handleDistinctEvent: function(data) {
    // update selectedValues
    if (!data.evt[MODIFIERKEY]) {
      if (this.selectedValues.length === 1 && this.selectedValues[0].self === data.self) {
        this.selectedValues = [];
      } else {
        this.selectedValues = [data];
      }
    } else if (_.contains(_.pluck(this.selectedValues, 'i'), data.i)) {
      _.remove(this.selectedValues, function(d) { return d.i === data.i; });
    } else {
      this.selectedValues.push(data);
    }

    // visual updates
    _.each(data.all, function(el) {
      el.classList.remove('selected');
      if (this.selectedValues.length === 0) {
        // remove all styling
        el.classList.remove('unselected');
      } else {
        el.classList.add('unselected');
      }
    }.bind(this));
    _.each(this.selectedValues, function(selected) {
      selected.self.classList.add('selected');
      selected.self.classList.remove('unselected');
    });

    // build new refineValue
    if (this.selectedValues.length === 0) {
      // no value
      this.unset('refineValue');
    } else if (this.selectedValues.length === 1) {
      // single value
      this.refineValue = new LeafValue(this._extractDistinctValue(this.selectedValues[0]), {
        parse: true
      });
    } else {
      // multiple values
      this.refineValue = new ListOperator({
        $in: this.selectedValues.map(this._extractDistinctValue.bind(this))
      }, { parse: true });
    }
  },

  /**
   * Handler for query builder events that result in range selection, e.g. number type.
   * single click selects individual element, shift-click selects range.
   * @param  {Object} data   the contains information about the event, @see handleQueryBuilderEvent
   */
  handleRangeEvent: function(data) {
    if (data.evt[MODIFIERKEY]) {
      this.selectedValues[1] = data;
    } else if (this.selectedValues[0] && this.selectedValues[0].i === data.i) {
      this.selectedValues = [];
    } else {
      this.selectedValues = [data];
    }
    var firstSelected = this.selectedValues[0];
    // remove `.selected` class from all elements
    _.each(data.all, function(el) {
      el.classList.remove('selected');
      if (!firstSelected) {
        el.classList.remove('unselected');
      } else {
        el.classList.add('unselected');
      }
    });
    if (!firstSelected) {
      // no value
      this.unset('refineValue');
    } else {
      var first = _.min(this.selectedValues, function(el) {
        return this._extractRangeValue(el);
      }.bind(this));
      var last = _.max(this.selectedValues, function(el) {
        return this._extractRangeValue(el);
      }.bind(this));
      var lower = this._extractRangeValue(first);
      var upper = this._extractRangeValue(last);
      if (this.model.getType() === 'Number') {
        upper += last.d.dx;
      }
      _.each(data.all.slice(first.i, last.i + 1), function(el) {
        el.classList.add('selected');
        el.classList.remove('unselected');
      });

      /* code for Date handling currently not implemented */

      // if (this.model.getType() === 'Number') {
      //   first = _.min(this.selectedValues, function(el) { return el.d.x; });
      //   last = _.max(this.selectedValues, function(el) { return el.d.x; });
      //   lower = first.d.x;
      //   upper = last.d.x + last.d.dx;
      //   _.each(data.all.slice(first.i, last.i + 1), function(el) {
      //     el.classList.add('selected');
      //     el.classList.remove('unselected');
      //   });
      //   this.refineValue = new Range(lower, upper);
      // } else if (this.model.getType() === 'Date') {
      //   first = _.min(this.selectedValues, function(el) { return el.d.getTime(); });
      //   last = _.max(this.selectedValues, function(el) { return el.d.getTime(); });
      //   lower = first.d;
      //   upper = last.d;
      // _(data.all)
      //   .filter(function(el) {
      //     var val = this._extractRangeValue(el);
      //     debug('comp', val, upper, lower);
      //     return val >= upper && val < lower;
      //   })
      //   .each(function(el) {
      //     el.self.classList.add('selected');
      //     el.self.classList.remove('unselected');
      //   });
      if (lower === upper) {
        this.refineValue = new LeafValue({ content: lower });
      } else {
        var upperInclusive = last.d.dx === 0;
        this.refineValue = new Range(lower, upper, upperInclusive);
      }
    }
  },
  /**
   * Handles query builder events, routing them to the appropriate specific handler methods
   * @param  {Object} data   contains information about the event, namely
   * {
   *   d: the data point
   *   i: the index of the clicked element
   *   self: the dom element itself
   *   all: all clickable dom elements in this chart
   *   evt: the event object
   *   type: the type of event (currently only 'click')
   *   source: where the event originated, currently 'few', 'many', 'unique', 'date'
   * }
   */
  handleQueryBuilderEvent: function(data) {
    data.evt.stopPropagation();
    data.evt.preventDefault();

    switch (this.model.getType()) {
      case 'Boolean': // fall-through to String
      case 'String':
        this.handleDistinctEvent(data);
        break;
      case 'Number':
        if (data.source === 'unique') {
          this.handleDistinctEvent(data);
        } else {
          this.handleRangeEvent(data);
        }
        break;
      case 'ObjectID': // fall-through to Date
      case 'Date':
        // @todo: for dates, data.all is not sorted, so this is not yet working
        // this.handleRange(data);
        break;
      default: // @todo other types not implemented yet
        break;
    }
  }
};
