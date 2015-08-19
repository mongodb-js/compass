var _ = require('lodash');
var $ = require('jquery');
var d3 = require('d3');
var app = require('ampersand-app');
var LeafValue = require('mongodb-language-model').LeafValue;
var LeafClause = require('mongodb-language-model').LeafClause;
var ListOperator = require('mongodb-language-model').ListOperator;
var Range = require('mongodb-language-model').helpers.Range;
var debug = require('debug')('scout:minicharts:querybuilder');

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

    // defocus currently active element (likely the refine bar) so it can update the query
    $(document.activeElement).blur();

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
    this.updateVolatileQuery();
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
    } else if (_.contains(this.selectedValues, data.d.value)) {
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
   * build new distinct ($in) query based on current selection and store in clause
   */
  buildQuery_distinct: function() {
    // build new value
    if (this.selectedValues.length === 0) {
      // no value
      this.value = null;
    } else if (this.selectedValues.length === 1) {
      // single value
      this.value = new LeafValue(this.selectedValues[0], {
        parse: true
      });
    } else {
      // multiple values
      this.value = new ListOperator({
        $in: this.selectedValues.map(function(el) {
          return el;
        })
      }, {
        parse: true
      });
    }
  },

  /**
   * build new range ($gte, $lt(e)) query based on current selection and store in clause
   */
  buildQuery_range: function() {
    var firstSelected = this.selectedValues[0];
    if (firstSelected === undefined) {
      this.value = null;
      return;
    }
    var res = this._getRangeBoundsHelper();
    this.unset('lowerRangeOperator');
    this.upperRangeOperator = res.isBinned ? '$gt' : '$gte';

    if (res.lower === res.upper) {
      this.value = new LeafValue({
        content: res.lower
      });
    } else {
      this.value = new Range(res.lower, res.upper, !res.isBinned);
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
      if (this.model.getType() === 'Number') {
        elData = parseFloat(elData, 10);
      }
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
    var firstSelected = this.selectedValues[0] !== undefined;
    // remove `.selected` and `.half` classes from all elements
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
        var d = getOrderedValueHelper(d3.select(el).data()[0]);
        // var state = 'unselected';
        // if (res.isBinned) {
        // } else {
        //   state = d.value >= res.lower && d.value <= res.upper ? 'selected' : 'unselected';
        // }
        if ((res.isBinned ? d.value + d.dx > res.lower : d.value >= res.lower)
          && (res.isBinned ? d.value < res.upper : d.value <= res.upper)) {
          el.classList.add('selected');
          el.classList.remove('unselected');
        }
      });

      // if first or last bar is not fully included in range, mark it as "half selected"
      // if (res.isBinned) {
      //   var selected = this.queryAll('.selectable.selected');
      //   if (selected.length === 0) return;
      //   var first = _.first(selected);
      //   var firstData = d3.select(first).data()[0];
      //   if (firstData.value + firstData.dx > res.lower) {
      //     first.classList.add('half');
      //   }
      //   var last = _.last(selected);
      //   var lastData = d3.select(last).data()[0];
      //   if (lastData.value + lastData.dx > res.upper) {
      //     last.classList.add('half');
      //   }
      // }
    }
  },

  /**
   * pushes a new value downstream, which originates from manual changes in the refine bar.
   * This function updates selectedValues based on the value.
   *
   * @param  {Value} value  value pushed down from refine bar
   */
  processValue: function(value) {
    if (!this.rendered) return;
    if (!value || !value.valid) {
      this.selectedValues = [];
      this.updateUI_distinct();
      return;
    }
    if (value.className === 'LeafValue') {
      this.selectedValues = [value.buffer];
      this.updateUI_distinct();
      return;
    } else if (value.className === 'OperatorObject') {
      var inOperator = value.operators.get('$in');
      if (inOperator) {
        // case: $in query
        this.selectedValues = inOperator.values.serialize();
        this.updateUI_distinct();
        return;
      }
      if (['$gt', '$lt', '$gte', '$lte'].indexOf(value.operators.at(0).operator) !== -1) {
        // case: range query
        this.selectedValues = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
        value.operators.each(function(operator) {
          if (_.startsWith(operator.operator, '$gt')) {
            this.selectedValues[0] = operator.value.buffer;
            this.lowerRangeOperator = operator.operator;
          } else if (_.startsWith(operator.operator, '$lt')) {
            this.selectedValues[1] = operator.value.buffer;
            this.upperRangeOperator = operator.operator;
          } else {
            // unsupported case, ignore
          }
        }.bind(this));
        this.updateUI_range();
        return;
      }
    } else {
      // unsupported case, ignore
    }
  },
  /**
   * Query Builder downwards pass
   * The query was changed in the refine bar, we need to see if there is a
   * relevant clause for this minichart, and update the UI accordingly. If there isn't one, we
   * pass `undefined` to processValue so the selection gets cleared.
   *
   * @param  {QueryOptions} volatileQueryOptions    the volatile query options (not needed)
   * @param  {Query} query                          the new query
   */
  volatileQueryChanged: function(volatileQueryOptions, query) {
    var clause = query.clauses.get(this.model.path);
    if (!clause) {
      this.processValue();
    } else {
      this.processValue(clause.value);
    }
  },
  /**
   * Query Builder upwards pass
   * The user interacted with the minichart to build a query. We need to ask the volatile query
   * if a relevant clause exists already, and replace the value, or create a new clause. In the
   * case of an empty selection, we need to potentially restore the previous original value.
   */
  updateVolatileQuery: function() {
    var query = app.volatileQueryOptions.query;
    var clause = query.clauses.get(this.model.path);
    if (clause && this.value === null) {
      // no selection on this minichart, try to restore previous value
      var previousClause = app.queryOptions.query.clauses.get(this.model.path);
      if (!previousClause) {
        query.clauses.remove(clause);
      } else {
        clause.value = previousClause.value;
      }
    } else if (!clause) {
      clause = new LeafClause();
      clause.key.content = this.model.path;
      clause.value = this.value;
      query.clauses.add(clause);
    } else {
      clause.value = this.value;
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
    var lower;
    var upper;
    if (this.model.getType() === 'Number') {
      // numbers are ordered
      lower = _.first(this.selectedValues);
      upper = _.last(this.selectedValues);
    } else {
      // dates and objectids are not ordered
      lower = _.min(this.selectedValues, function(el) {
        return getOrderedValueHelper(el);
      });
      upper = _.max(this.selectedValues, function(el) {
        return getOrderedValueHelper(el);
      });
    }

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
