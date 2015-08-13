var _ = require('lodash');
var debug = require('debug')('scout:minicharts:index');
var d3 = require('d3');

var LeafValue = require('mongodb-language-model').LeafValue;
var ListOperator = require('mongodb-language-model').ListOperator;
var Range = require('mongodb-language-model').helpers.Range;

var MODIFIERKEY = 'shiftKey';

module.exports = {
  /**
   * Extract a value that can be compared
   * @param  {Object} d   event data object triggered by the minichart
   * @return {Any}        value to be returned that can be used for comparisons < and >
   */
  _getComparableValue: function(d) {
    return d.value._bsontype === 'ObjectID' ? d.value.getTimestamp() : d.value;
  },

  /**
   * build new distinct ($in) query based on current selection and store as this.refineValue.
   */
  buildDistinctQuery: function() {
    // build new refineValue
    if (this.selectedValues.length === 0) {
      // no value
      this.unset('refineValue');
    } else if (this.selectedValues.length === 1) {
      // single value
      this.refineValue = new LeafValue(this.selectedValues[0].value, {
        parse: true
      });
    } else {
      // multiple values
      this.refineValue = new ListOperator({
        $in: this.selectedValues.map(function(el) {
          return el.value;
        })
      }, { parse: true });
    }
  },

  /**
   * Handler for query builder events that result in distinct selection, e.g. string and unique
   * type. Single click selects individual element, shift-click adds to selection.
   * @param  {Object} data   the contains information about the event, @see handleQueryBuilderEvent
   */
  handleDistinctEvent: function(data) {
    // update selectedValues
    if (!data.evt[MODIFIERKEY]) {
      if (this.selectedValues.length === 1 && this.selectedValues[0].value === data.d.value) {
        this.selectedValues = [];
      } else {
        this.selectedValues = [data.d];
      }
    } else if (_.contains(_.pluck(this.selectedValues, 'value'), data.d.value)) {
      _.remove(this.selectedValues, function(d) { return d.value === data.d.value; });
    } else {
      this.selectedValues.push(data.d);
    }

    // visual updates
    _.each(data.all, function(el) {
      var elData = data.source === 'unique' ? el.innerText : d3.select(el).data()[0].value;
      if (_.contains(_.pluck(this.selectedValues, 'value'), elData)) {
        el.classList.add('selected');
        el.classList.remove('unselected');
      } else {
        el.classList.remove('selected');
        if (this.selectedValues.length === 0) {
          el.classList.remove('unselected');
        } else {
          el.classList.add('unselected');
        }
      }
    }.bind(this));
  },

  buildRangeQuery: function() {
    var firstSelected = this.selectedValues[0];
    var getComparableValue = this._getComparableValue.bind(this);

    if (!firstSelected) {
      this.unset('refineValue');
      return;
    }
    var first = _.min(this.selectedValues, function(el) {
      return getComparableValue(el);
    });
    var last = _.max(this.selectedValues, function(el) {
      return getComparableValue(el);
    });
    var upperInclusive = last.dx === 0;

    var lower = first.value;
    var upper = last.value;
    if (this.model.getType() === 'Number') {
      upper += last.dx;
    }
    if (lower === upper) {
      this.refineValue = new LeafValue({ content: lower });
    } else {
      this.refineValue = new Range(lower, upper, upperInclusive);
    }
  },

  /**
   * Handler for query builder events that result in range selection, e.g. number type.
   * single click selects individual element, shift-click extends to range (the single click is
   * interpreted as one end of the range, shift-click as the other).
   * @param  {Object} data   the contains information about the event, @see handleQueryBuilderEvent
   */
  handleRangeEvent: function(data) {
    if (data.evt[MODIFIERKEY]) {
      this.selectedValues[1] = data.d;
    } else if (this.selectedValues[0] && this.selectedValues[0].value === data.d.value) {
      this.selectedValues = [];
    } else {
      this.selectedValues = [data.d];
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
      var getComparableValue = this._getComparableValue.bind(this);
      var first = _.min(this.selectedValues, function(el) {
        return getComparableValue(el);
      });
      var last = _.max(this.selectedValues, function(el) {
        return getComparableValue(el);
      });

      // use getComparableValue to determine what elements should be selected
      var lower = getComparableValue(first);
      var upper = getComparableValue(last);
      if (this.model.getType() === 'Number') {
        upper += last.dx;
      }

      /**
       * if the UI element represents a range (i.e. binned histograms where one bar represents
       * 20-30, the next one 30-40, etc.) then the upper limit is non-inclusive ($lt).
       * If however the UI elements represents a single number, then the upper limit is
       * inclusive ($lte).
       * This is indicated by the d.dx variable, which is only > 0 for binned ranges.
       */
      var upperInclusive = last.dx === 0;
      _.each(data.all, function(el) {
        var elData = getComparableValue(d3.select(el).data()[0]);
        if (elData >= lower && (upperInclusive ? elData <= upper : elData < upper)) {
          el.classList.add('selected');
          el.classList.remove('unselected');
        }
      });
    }
  },
  handleDragEvent: function(data) {
    this.selectedValues = d3.selectAll(data.selected).data();
  },
  /**
   * Handles query builder events, routing them to the appropriate specific handler methods
   * @param  {Object} data   contains information about the event.
   *
   * For `click` events, data looks like this:
   * {
   *   d: the data point
   *   self: the dom element itself
   *   all: all clickable dom elements in this chart
   *   evt: the event object
   *   type: 'click'
   *   source: where the event originated, currently 'few', 'many', 'unique', 'date'
   * }
   *
   * For `drag` events, data looks like this:
   * {
   * 	 selected: array of selected values
   * 	 type: 'click',
   * 	 source: where the event originated, currently 'many', 'date'
   * }
   *
   */
  handleQueryBuilderEvent: function(data) {
    var distinctEvent = data.type === 'drag' ? this.handleDragEvent : this.handleDistinctEvent;
    var rangeEvent = data.type === 'drag' ? this.handleDragEvent : this.handleRangeEvent;

    if (data.type === 'click') {
      data.evt.stopPropagation();
      data.evt.preventDefault();
    }

    switch (this.model.getType()) {
      case 'Boolean': // fall-through to String
      case 'String':
        distinctEvent.call(this, data);
        this.buildDistinctQuery();
        break;
      case 'Number':
        if (data.source === 'unique') {
          distinctEvent.call(this, data);
          this.buildDistinctQuery();
        } else {
          rangeEvent.call(this, data);
          this.buildRangeQuery();
        }
        break;
      case 'ObjectID': // fall-through to Date
      case 'Date':
        // @todo: for dates, data.all is not sorted, so this is not yet working
        rangeEvent.call(this, data);
        this.buildRangeQuery();
        break;
      default: // @todo other types not implemented yet
        break;
    }
  }
};
