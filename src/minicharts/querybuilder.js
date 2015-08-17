var _ = require('lodash');
var d3 = require('d3');

var LeafValue = require('mongodb-language-model').LeafValue;
var ListOperator = require('mongodb-language-model').ListOperator;
var Range = require('mongodb-language-model').helpers.Range;
var debug = require('debug')('scout:minicharts:querybuilder');

var MODIFIERKEY = 'shiftKey';

module.exports = {
  /**
   * Extract a value that can be ordered (e.g. number, date, ...)
   * @param  {Object} d   event data object triggered by the minichart
   * @return {Any}        value to be returned that can be used for comparisons < and >
   */
  _getOrderedValue: function(d) {
    if (!d.value._bsontype) return d.value;
    return d.value._bsontype === 'ObjectID' ? d.value.getTimestamp() : d.value;
  },

  /**
   * build new distinct ($in) query based on current selection and store as this.refineValue.
   */
  buildQuery_distinct: function() {
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
      }, {
        parse: true
      });
    }
  },

  /**
   * build new range ($gte, $lt(e)) query based on current selection and store as this.refineValue.
   */
  buildQuery_range: function() {
    var firstSelected = this.selectedValues[0];
    var getOrderedValue = this._getOrderedValue.bind(this);

    if (!firstSelected) {
      this.unset('refineValue');
      return;
    }
    var first = _.min(this.selectedValues, function(el) {
      return getOrderedValue(el);
    });
    var last = _.max(this.selectedValues, function(el) {
      return getOrderedValue(el);
    });
    var upperInclusive = last.dx === 0;

    var lower = first.value;
    var upper = last.value;
    if (this.model.getType() === 'Number') {
      upper += last.dx;
    }
    if (lower === upper) {
      this.refineValue = new LeafValue({
        content: lower
      });
    } else {
      this.refineValue = new Range(lower, upper, upperInclusive);
    }
  },

  /**
   * update the UI after a distinct query and mark appropriate elements with .select class.
   * @param  {Object} data   data object of the event
   */
  updateUI_distinct: function(data) {
    var uiElements = this.queryAll('.selectable');
    _.each(uiElements, function(el) {
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

  /**
   * update the UI after a range query and mark appropriate elements with .select class.
   * @param  {Object} data   data object of the event
   */
  updateUI_range: function() {
    var firstSelected = this.selectedValues[0];
    // remove `.selected` class from all elements
    var uiElements = this.queryAll('.selectable');
    _.each(uiElements, function(el) {
      el.classList.remove('selected');
      if (!firstSelected) {
        el.classList.remove('unselected');
      } else {
        el.classList.add('unselected');
      }
    });
    if (firstSelected) {
      var getOrderedValue = this._getOrderedValue.bind(this);
      var first = _.min(this.selectedValues, function(el) {
        return getOrderedValue(el);
      });
      var last = _.max(this.selectedValues, function(el) {
        return getOrderedValue(el);
      });

      // use getOrderedValue to determine what elements should be selected
      var lower = getOrderedValue(first);
      var upper = getOrderedValue(last);
      var dx = d3.select(_.last(uiElements)).data()[0].dx;
      var isBinned = this.model.getType() === 'Number' && dx;
      if (isBinned) {
        upper += dx;
      }

      /**
       * if the UI element represents a range (i.e. binned histograms where one bar represents
       * 20-30, the next one 30-40, etc.) then the upper limit is non-inclusive ($lt).
       * If however the UI elements represents a single number, then the upper limit is
       * inclusive ($lte).
       * This is indicated by the d.dx variable, which is only > 0 for binned ranges.
       */
      _.each(uiElements, function(el) {
        var elData = getOrderedValue(d3.select(el).data()[0]);
        if (elData >= lower && (isBinned ? elData < upper : elData <= upper)) {
          el.classList.add('selected');
          el.classList.remove('unselected');
        }
      });
    }
  },

  /**
   * Handler for query builder events that result in distinct selection, e.g. string and unique
   * type. Single click selects individual element, shift-click adds to selection.
   *
   * For distinct-type minicharts, this.selectedValues contains an entry for each selected value.
   *
   * @param  {Object} data   contains information about the event, @see handleQueryBuilderEvent
   */
  handleEvent_distinct: function(data) {
    // update selectedValues
    if (!data.evt[MODIFIERKEY]) {
      if (this.selectedValues.length === 1 && this.selectedValues[0].value === data.d.value) {
        // case where 1 element is selected and it is clicked again (need to unselect)
        this.selectedValues = [];
      } else {
        // case where multiple or no elements are selected (need to select that one item)
        this.selectedValues = [data.d];
      }
    } else if (_.contains(_.pluck(this.selectedValues, 'value'), data.d.value)) {
      // case where selected element is shift-clicked (need to remove from selection)
      _.remove(this.selectedValues, function(d) {
        return d.value === data.d.value;
      });
    } else {
      // case where unselected element is shift-clicked (need to add to selection)
      this.selectedValues.push(data.d);
    }
  },

  /**
   * Handler for query builder events that result in range selection, e.g. number type.
   * single click selects individual element, shift-click extends to range (the single click is
   * interpreted as one end of the range, shift-click as the other).
   *
   * For range-type minicharts, this.selectedValues contains two values, the lower and upper bound.
   * The 0th value is the one selected via regular click, the 1st value is the shift-clicked one.
   * If only a single value is selected ($eq), is stored at the 0th index.
   *
   * @param  {Object} data   the contains information about the event, @see handleQueryBuilderEvent
   */
  handleEvent_range: function(data) {
    if (data.evt[MODIFIERKEY]) {
      // shift-click modifies the value at index 1
      this.selectedValues[1] = data.d;
    } else if (this.selectedValues[0] && this.selectedValues[0].value === data.d.value) {
      // case where single selected item is clicked again (need to unselect)
      this.selectedValues = [];
    } else {
      // case where multiple or no elements are selected (need to just select one item)
      this.selectedValues = [data.d];
    }
  },
  /**
   * Handler for query builder events created with a click-drag mouse action. The visual updates
   * are handled by d3 directly, so all we have to do is update the selected values based on the
   * selected elements.
   *
   * @param  {Object} data   the contains information about the event, @see handleQueryBuilderEvent
   */
  handleEvent_drag: function() {
    this.selectedValues = d3.selectAll(this.queryAll('.selectable.selected')).data();
  },
  /**
   * Handles query builder events, routing them to the appropriate specific handler methods
   * @param  {Object} data   contains information about the event.
   *
   * For `click` events, data looks like this:
   * {
   *   d: the data point
   *   self: the dom element itself
   *   evt: the event object
   *   type: 'click'
   *   source: where the event originated, currently 'few', 'many', 'unique', 'date'
   * }
   *
   * For `drag` events, data looks like this:
   * {
   *   selected: array of selected values
   *   type: 'click',
   *   source: where the event originated, currently 'many', 'date'
   * }
   *
   */
  handleQueryBuilderEvent: function(data) {
    var queryType;

    if (data.type === 'click') {
      data.evt.stopPropagation();
      data.evt.preventDefault();
    }

    // determine what kind of query this is (distinct or range)
    switch (this.model.getType()) {
      case 'Boolean': // fall-through to String
      case 'String':
        queryType = 'distinct';
        break;
      case 'Number':
        if (data.source === 'unique') {
          queryType = 'distinct';
        } else {
          queryType = 'range';
        }
        break;
      case 'ObjectID': // fall-through to Date
      case 'Date':
        queryType = 'range';
        break;
      default: // @todo other types not implemented yet
        throw new Error('unsupported querybuilder type ' + this.model.getType());
    }

    // now call appropriate event handlers and query build methods
    if (data.type === 'drag') {
      this.handleEvent_drag();
    } else {
      this['handleEvent_' + queryType](data);
    }
    this['buildQuery_' + queryType]();
    this['updateUI_' + queryType](data);
  }
};
