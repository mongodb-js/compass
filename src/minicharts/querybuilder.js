var _ = require('lodash');
var $ = require('jquery');
var d3 = require('d3');
var app = require('ampersand-app');
var LeafValue = require('mongodb-language-model').LeafValue;
var LeafClause = require('mongodb-language-model').LeafClause;
var ListOperator = require('mongodb-language-model').ListOperator;
var Range = require('mongodb-language-model').helpers.Range;
// var debug = require('debug')('scout:minicharts:querybuilder');

var MODIFIERKEY = 'shiftKey';
var checkBounds = {
  $gte: function(a, b) {
    return a >= b;
  },
  $gt: function(a, b) {
    return a > b;
  },
  $lte: function(a, b) {
    return a <= b;
  },
  $lt: function(a, b) {
    return a < b;
  }
};

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
    var message = {
      data: data
    };

    if (data.type === 'drag') {
      message = this.updateSelection_drag(message);
      message = this['buildQuery_' + queryType](message);
    } else {
      message = this['updateSelection_' + queryType](message);
      message = this['buildQuery_' + queryType](message);
      message = this['updateUI_' + queryType](message);
    }
    this.updateVolatileQuery(message);
  },
  /**
   * adds `selected` for distinct query builder events, e.g. string and unique
   * type. Single click selects individual element, shift-click adds to selection.
   *
   * For distinct-type minicharts, `selected` contains an entry for each selected value.
   *
   * @param   {Object} message   message with key: data
   * @return  {Object} message   message with keys: data, selected
   */
  updateSelection_distinct: function(message) {
    if (!message.data.evt[MODIFIERKEY]) {
      if (this.selectedValues.length === 1 && this.selectedValues[0] === message.data.d.value) {
        // case where 1 element is selected and it is clicked again (need to unselect)
        this.selectedValues = [];
      } else {
        // case where multiple or no elements are selected (need to select that one item)
        this.selectedValues = [message.data.d.value];
      }
    } else if (_.contains(this.selectedValues, message.data.d.value)) {
      // case where selected element is shift-clicked (need to remove from selection)
      _.remove(this.selectedValues, function(d) {
        return d === message.data.d.value;
      });
    } else {
      // case where unselected element is shift-clicked (need to add to selection)
      this.selectedValues.push(message.data.d.value);
    }
    message.selected = this.selectedValues;
    return message;
  },

  /**
   * adds `selected` and `dx` for range query builder events, e.g. number, date, objectid type.
   * single click selects individual element, shift-click extends to range (the single click is
   * interpreted as one end of the range, shift-click as the other).
   *
   * For range-type minicharts, `selected` contains up to two values, the lower and upper bound.
   * The 0th value is the one selected via regular click, the 1st value is the shift-clicked one.
   *
   * @param   {Object} message   message with key: data
   * @return  {Object} message   message with keys: data, selected, dx
   */
  updateSelection_range: function(message) {
    var definedValues = _.filter(this.selectedValues, function(i) {
      return i !== undefined;
    });
    if (definedValues.length === 1 && definedValues[0] === message.data.d.value) {
      // case where single selected item is clicked again (need to unselect)
      this.selectedValues = [];
    } else if (message.data.evt[MODIFIERKEY]) {
      // shift-click modifies the value at index 1
      this.selectedValues[1] = message.data.d.value;
    } else {
      // case where multiple or no elements are selected (need to just select one item)
      this.selectedValues = [message.data.d.value];
    }
    message.dx = message.data.d.dx || 0;
    message.selected = this.selectedValues;

    return message;
  },
  /**
   * updates `selected` for query builder events created with a click-drag mouse action.
   * The visual updates are handled by d3 directly, so all we have to do is update the selected
   * values based on the selected elements. Need to get dx from one of the selected bars as we
   * don't get it through the message.data object like for individual clicks.
   *
   * @param   {Object} message   message with key: data
   * @return  {Object} message   message with keys: data, selected, dx
   */
  updateSelection_drag: function(message) {
    var data = d3.selectAll(this.queryAll('.selectable.selected')).data();
    message.dx = _.has(data[0], 'dx') ? data[0].dx : 0;
    this.selectedValues = _.pluck(data, 'value');
    message.selected = this.selectedValues;

    return message;
  },
  /**
   * build new distinct ($in) query based on current selection
   *
   * @param   {Object} message   message with keys: data, selected
   * @return  {Object} message   message with keys: data, selected, value, elements, op
   */
  buildQuery_distinct: function(message) {
    message.elements = this.queryAll('.selectable');
    message.op = '$in';

    // build new value
    if (message.selected.length === 0) {
      // no value
      message.value = null;
    } else if (message.selected.length === 1) {
      // single value
      message.value = new LeafValue(message.selected[0], {
        parse: true
      });
    } else {
      // multiple values
      message.value = new ListOperator({
        $in: message.selected.map(function(el) {
          return el;
        })
      }, {
        parse: true
      });
    }
    return message;
  },

  /**
  * build new range ($gte, $lt(e)) query based on current selection and store in clause.
  * If the UI element represents a range (i.e. binned histograms where one bar represents
  * 20-30, the next one 30-40, etc.) then the upper limit is non-inclusive ($lt).
  * If however the UI elements represents a single number, then the upper limit is
  * inclusive ($lte). This is indicated by the d.dx variable, which is only > 0 for binned ranges.
  *
  * @param   {Object} message   message with keys: data, selected, dx
  * @return  {Object} message   message with keys: data, selected, value, elements, lowerOp
  *                             upperOp, dx
  */
  buildQuery_range: function(message) {
    message.selected = this._getRangeExtent(message.selected);
    message.elements = this.queryAll('.selectable');

    // handle empty selection
    if (message.selected.length === 0) {
      message.value = null;
      return message;
    }

    if (message.selected.length === 1) {
      if (message.dx > 0) {
        // binned values, turn single selection into a range
        message.selected[1] = message.selected[0] + message.dx;
      } else {
        message.value = new LeafValue({
          content: message.selected[0]
        });
        return message;
      }
    } else if (message.selected.length === 2) {
      if (message.dx > 0) {
        // binned values, we need to increase the upper bound by the bin size
        message.selected[1] += message.dx;
      }
    } else {
      // should never end up here
      throw new Error('message.selected should never be longer than 2 elements here!');
    }

    // at this point we definitely have 2 selected values to build a range
    message.lowerOp = '$gte';
    message.upperOp = message.dx > 0 ? '$lt' : '$lte';

    // in upwards pass, increase upper bound according to bin size
    message.value = new Range(message.selected[0], message.selected[1], message.dx === 0);

    return message;
  },

  /**
   * update the UI after a distinct query and mark appropriate elements with .select class.
   *
   * @param   {Object} message   message with keys: data, selected, value, elements
   * @return  {Object} message   no changes on message, just pass it through for consistency
   */
  updateUI_distinct: function(message) {
    // in case message was not submitted (e.g. from unique minicharts), reconstruct it here
    if (!message) {
      message = {
        selected: this.selectedValues,
        elements: this.queryAll('.selectable')
      };
    }
    _.each(message.elements, function(el) {
      var elData = el.innerText || d3.select(el).data()[0].value;
      if (this.model.getType() === 'Number') {
        elData = parseFloat(elData, 10);
      }
      if (_.contains(message.selected, elData)) {
        el.classList.add('selected');
        el.classList.remove('unselected');
      } else {
        el.classList.remove('selected');
        if (message.selected.length === 0) {
          el.classList.remove('unselected');
        } else {
          el.classList.add('unselected');
        }
      }
    }.bind(this));
    return message;
  },

  /**
   * update the UI after a range query and mark appropriate elements with .select class.
   *
   * @param  {Object} message   message with keys: data, selected, value, elements, lowerOp,
   *                            upperOp, dx
   * @return {Object} message   no changes on message, just pass it through for consistency
   */
  updateUI_range: function(message) {
    // remove `.selected` and `.half` classes from all elements
    _.each(message.elements, function(el) {
      el.classList.remove('selected');
      el.classList.remove('half');
      if (message.selected.length === 0) {
        el.classList.remove('unselected');
      } else {
        el.classList.add('unselected');
      }
    });
    if (message.selected.length > 0) {
      var getOrderedValueHelper = this._getOrderedValueHelper.bind(this);
      _.each(message.elements, function(el) {
        var d = getOrderedValueHelper(d3.select(el).data()[0]);
        var mustSelect = false;
        if (message.selected.length === 1) {
          // handle single selection of non-binned data
          mustSelect = d.value === message.selected[0];
        } else if (message.dx === 0) {
          // handle non-binned ranges
          mustSelect = checkBounds[message.lowerOp](d.value, message.selected[0])
            && checkBounds[message.upperOp](d.value, message.selected[1]);
        } else {
          // handle binned ranges
          var halfSelect = false;
          /**
           * 4 cases to consider: upper/lower bound  x  hit bound exactly/not
           */
          if (d.value === message.selected[0]) {
            // lower bound exact match
            mustSelect = true;
            halfSelect = message.lowerOp === '$gt';
          } else {
            // lower bound no exact match
            mustSelect = d.value + message.dx > message.selected[0];
            halfSelect = d.value < message.selected[0];
          }
          if (d.value === message.selected[1]) {
            // upper bound exact match
            mustSelect = mustSelect && message.upperOp === '$lte';
            halfSelect = true;
          } else {
            // upper bound no exact match
            mustSelect = mustSelect && d.value < message.selected[1];
            halfSelect = halfSelect || d.value + message.dx > message.selected[1];
          }
          // mustSelect = lowerSelect && upperSelect;
        }
        if (mustSelect) {
          el.classList.add('selected');
          if (halfSelect) {
            el.classList.add('half');
          }
          el.classList.remove('unselected');
        }
      });
    }
    return message;
  },
  /**
   * Query Builder upwards pass
   * The user interacted with the minichart to build a query. We need to ask the volatile query
   * if a relevant clause exists already, and replace the value, or create a new clause. In the
   * case of an empty selection, we need to potentially restore the previous original value.
   *
   * @param    {Object} message   message with keys: data, selected, value, lowerOp, upperOp,
   *                              elements, dx
   */
  updateVolatileQuery: function(message) {
    var query = app.volatileQueryOptions.query;
    var clause = query.clauses.get(this.model.path);
    if (clause) {
      if (message.value !== null) {
        clause.value = message.value;
      } else {
        // no selection on this minichart, try to restore previous value
        var previousClause = app.queryOptions.query.clauses.get(this.model.path);
        if (!previousClause) {
          query.clauses.remove(clause);
        } else {
          clause.value = previousClause.value;
        }
      }
    } else if (message.value !== null) {
      clause = new LeafClause();
      clause.key.content = this.model.path;
      clause.value = message.value;
      query.clauses.add(clause);
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
  handleVolatileQueryChange: function(volatileQueryOptions, query) {
    var clause = query.clauses.get(this.model.path);
    if (!clause) {
      this.processValue();
    } else {
      this.processValue(clause.value);
    }
  },
  /**
   * pushes a new value downstream, which originates from manual changes in the refine bar.
   * This function updates selectedValues based on the value.
   *
   * @param  {Value} value  value pushed down from refine bar for this minichart
   */
  processValue: function(value) {
    if (!this.rendered) {
      return;
    }

    var message = {
      elements: this.queryAll('.selectable')
    };

    if (!value || !value.valid) {
      this.selectedValues = [];
      // updateUI_distinct will do the right thing here and clear any selection,
      // even in the case where the minichart is a range type.
      message.selected = this.selectedValues;
      this.updateUI_distinct(message);
      return;
    }
    if (value.className === 'LeafValue') {
      this.selectedValues = [value.buffer];
      message.selected = this.selectedValues;
      this.updateUI_distinct(message);
      return;
    } else if (value.className === 'OperatorObject') {
      var inOperator = value.operators.get('$in');
      if (inOperator) {
        // case: $in query
        this.selectedValues = inOperator.values.serialize();
        message.selected = this.selectedValues;
        this.updateUI_distinct(message);
        return;
      }
      if (['$gt', '$lt', '$gte', '$lte'].indexOf(value.operators.at(0).operator) !== -1) {
        // case: range query
        this.selectedValues = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
        message.lowerOp = '$gt';
        message.upperOp = '$lt';
        value.operators.each(function(operator) {
          if (_.startsWith(operator.operator, '$gt')) {
            this.selectedValues[0] = operator.value.buffer;
            message.lowerOp = operator.operator;
          } else if (_.startsWith(operator.operator, '$lt')) {
            this.selectedValues[1] = operator.value.buffer;
            message.upperOp = operator.operator;
          } else {
            // unsupported case, ignore
          }
        }.bind(this));
        // get dx from a selectable dom element
        var data = d3.selectAll(this.queryAll('.selectable')).data();
        message.dx = _.has(data[0], 'dx') ? data[0].dx : 0;
        message.selected = this.selectedValues;
        this.updateUI_range(message);
        return;
      }
    } else {
      // unsupported case, ignore
    }
  },

  /**
   * Extract a value that can be ordered (e.g. number, date, ...)
   * @param  {Object} d   event data object triggered by the minichart
   * @return {Any}        value to be returned that can be used for comparisons < and >
   */
  _getOrderedValueHelper: function(d) {
    if (!d._bsontype) {
      return d;
    }
    return d._bsontype === 'ObjectID' ? d.getTimestamp() : d;
  },
  /**
   * takes a selection of elements and returns a copy containing at most 2 elements. If the
   * original selection length was less than two, a copy of the original selection is returned.
   * If the original selection length was 2 or more, return an array with the min and the max.
   * @param  {Array} selection    the original selection
   * @return {Array}              array of at most 2 values, min and max of the original selection
   */
  _getRangeExtent: function(selection) {
    if (selection.length < 2) {
      return selection.slice();
    }
    var getOrderedValueHelper = this._getOrderedValueHelper.bind(this);
    var lower = _.min(selection, function(el) {
      return getOrderedValueHelper(el);
    });
    var upper = _.max(selection, function(el) {
      return getOrderedValueHelper(el);
    });
    if (lower === upper) {
      return [lower];
    }
    return [lower, upper];
  }
};
