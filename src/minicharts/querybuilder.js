var _ = require('lodash');
var d3 = require('d3');

var LeafValue = require('mongodb-language-model').LeafValue;
var ListOperator = require('mongodb-language-model').ListOperator;
var Range = require('mongodb-language-model').helpers.Range;
// var debug = require('debug')('scout:minicharts:querybuilder');

var MODIFIERKEY = 'shiftKey';

module.exports = {
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
      this.updateSelection_drag();
      this['buildQuery_' + queryType]();
    } else {
      this['updateSelection_' + queryType](data);
      this['buildQuery_' + queryType]();
      this['updateUI_' + queryType]();
    }

    // setTimeout(function() {
    //   this.selectedValues = [13, 39];
    //   this.buildQuery_range();
    //   this.updateUI_range();
    // }.bind(this), 2000);
  },

  /**
   * Updates `selectedValues` for distinct query builder events, e.g. string and unique
   * type. Single click selects individual element, shift-click adds to selection.
   *
   * For distinct-type minicharts, this.selectedValues contains an entry for each selected value.
   *
   * @param  {Object} data   contains information about the event, @see handleQueryBuilderEvent
   */
  updateSelection_distinct: function(data) {
    // update selectedValues
    if (!data.evt[MODIFIERKEY]) {
      if (this.selectedValues.length === 1 && this.selectedValues[0] === data.d.value) {
        // case where 1 element is selected and it is clicked again (need to unselect)
        this.selectedValues = [];
      } else {
        // case where multiple or no elements are selected (need to select that one item)
        this.selectedValues = [data.d.value];
      }
    } else if (_.contains(_.pluck(this.selectedValues, 'value'), data.d.value)) {
      // case where selected element is shift-clicked (need to remove from selection)
      _.remove(this.selectedValues, function(d) {
        return d === data.d.value;
      });
    } else {
      // case where unselected element is shift-clicked (need to add to selection)
      this.selectedValues.push(data.d.value);
    }
  },

  /**
   * updates `selectedValues` for range query builder events, e.g. number, date, objectid type.
   * single click selects individual element, shift-click extends to range (the single click is
   * interpreted as one end of the range, shift-click as the other).
   *
   * For range-type minicharts, this.selectedValues contains two values, the lower and upper bound.
   * The 0th value is the one selected via regular click, the 1st value is the shift-clicked one.
   * If only a single value is selected ($eq), is stored at the 0th index.
   *
   * @param  {Object} data   the contains information about the event, @see handleQueryBuilderEvent
   */
  updateSelection_range: function(data) {
    if (data.evt[MODIFIERKEY]) {
      // shift-click modifies the value at index 1
      this.selectedValues[1] = data.d.value;
    } else if (this.selectedValues.length === 1 && this.selectedValues[0] === data.d.value) {
      // case where single selected item is clicked again (need to unselect)
      this.selectedValues = [];
    } else {
      // case where multiple or no elements are selected (need to just select one item)
      this.selectedValues = [data.d.value];
    }
  },
  /**
   * updates `selectedValues` for query builder events created with a click-drag mouse action.
   * The visual updates are handled by d3 directly, so all we have to do is update the selected
   * values based on the selected elements.
   *
   * @param  {Object} data   the contains information about the event, @see handleQueryBuilderEvent
   */
  updateSelection_drag: function() {
    var selected = d3.selectAll(this.queryAll('.selectable.selected'));
    this.selectedValues = _.pluck(selected.data(), 'value');
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
      this.refineValue = new LeafValue(this.selectedValues[0], {
        parse: true
      });
    } else {
      // multiple values
      this.refineValue = new ListOperator({
        $in: this.selectedValues.map(function(el) {
          return el;
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
    if (firstSelected === undefined) {
      this.unset('refineValue');
      return;
    }
    var res = this._getRangeBoundsHelper();
    if (res.lower === res.upper) {
      this.refineValue = new LeafValue({
        content: res.lower
      });
    } else {
      this.refineValue = new Range(res.lower, res.upper, !res.isBinned);
    }
  },

  /**
   * update the UI after a distinct query and mark appropriate elements with .select class.
   * @param  {Object} data   data object of the event
   */
  updateUI_distinct: function() {
    var uiElements = this.queryAll('.selectable');
    _.each(uiElements, function(el) {
      var elData = el.innerText || d3.select(el).data()[0].value;
      if (_.contains(this.selectedValues, elData)) {
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
      el.classList.remove('half');
      if (!firstSelected) {
        el.classList.remove('unselected');
      } else {
        el.classList.add('unselected');
      }
    });
    if (firstSelected) {
      var getOrderedValueHelper = this._getOrderedValueHelper.bind(this);
      var res = this._getRangeBoundsHelper();
      /**
       * if the UI element represents a range (i.e. binned histograms where one bar represents
       * 20-30, the next one 30-40, etc.) then the upper limit is non-inclusive ($lt).
       * If however the UI elements represents a single number, then the upper limit is
       * inclusive ($lte).
       * This is indicated by the d.dx variable, which is only > 0 for binned ranges.
       */
      _.each(uiElements, function(el) {
        var elData = getOrderedValueHelper(d3.select(el).data()[0]).value;
        if (elData >= res.lower && (res.isBinned ? elData < res.upper : elData <= res.upper)) {
          el.classList.add('selected');
          el.classList.remove('unselected');
        }
      });

      // if last bar is not fully included in range, mark it as "half selected"
      if (res.isBinned) {
        var last = _.last(this.queryAll('.selectable.selected'));
        var lastData = d3.select(last).data()[0];
        if (lastData.value + lastData.dx > res.upper) {
          last.classList.add('half');
        }
      }
    }
  },

  /**
   * Extract a value that can be ordered (e.g. number, date, ...)
   * @param  {Object} d   event data object triggered by the minichart
   * @return {Any}        value to be returned that can be used for comparisons < and >
   */
  _getOrderedValueHelper: function(d) {
    if (!d._bsontype) return d;
    return d._bsontype === 'ObjectID' ? d.getTimestamp() : d;
  },

  /**
   * helper method to determine the lower and upper bounds of a range and wheter the data
   * is binned or not.
   * @return {Object}   results in form of {lower: ..., upper: ..., isBinned: ...}
   */
  _getRangeBoundsHelper: function() {
    var getOrderedValueHelper = this._getOrderedValueHelper.bind(this);

    var lower = _.min(this.selectedValues, function(el) {
      return getOrderedValueHelper(el);
    });
    var upper = _.max(this.selectedValues, function(el) {
      return getOrderedValueHelper(el);
    });

    // find out if data is binned or not
    var uiElements = this.queryAll('.selectable');
    var dx = d3.select(_.last(uiElements)).data()[0].dx;
    var isBinned = this.model.getType() === 'Number' && !!dx;
    if (isBinned) {
      upper += dx;
    }

    return {
      lower: lower,
      upper: upper,
      isBinned: isBinned
    };
  }
};
