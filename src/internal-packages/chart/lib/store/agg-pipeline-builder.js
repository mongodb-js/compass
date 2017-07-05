const _ = require('lodash');
const {
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS,
  AGGREGATE_FUNCTION_ENUM
} = require('../constants');

// const debug = require('debug')('mongodb-compass:chart:agg-pipeline-builder');

/**
 * Array reduction operators wrapped as javascript functions
 */
const REDUCTIONS = Object.freeze({
  [ARRAY_GENERAL_REDUCTIONS.LENGTH]: function(arr) {
    return {
      $cond: {if: {$isArray: arr}, then: {$size: arr}, else: 0}
    };
  },
  [ARRAY_GENERAL_REDUCTIONS.INDEX]: function(arr, args) {
    return {
      $arrayElemAt: [arr, args[0]]
    };
  },

  // Numeric reductions
  [ARRAY_NUMERIC_REDUCTIONS.MAX]: function(arr) {
    return {
      $max: arr
    };
  },
  [ARRAY_NUMERIC_REDUCTIONS.MIN]: function(arr) {
    return {
      $min: arr
    };
  },
  [ARRAY_NUMERIC_REDUCTIONS.MEAN]: function(arr) {
    return {
      $avg: arr
    };
  },
  [ARRAY_NUMERIC_REDUCTIONS.SUM]: function(arr) {
    return {
      $sum: arr
    };
  },

  // String reductions
  [ARRAY_STRING_REDUCTIONS.MAX_LENGTH]: function(arr) {
    return {
      $max: {
        $map: {
          input: arr,
          as: 'str',
          in: {
            $strLenCP: '$$str'
          }
        }
      }
    };
  },
  [ARRAY_STRING_REDUCTIONS.MIN_LENGTH]: function(arr) {
    return {
      $min: {
        $map: {
          input: arr,
          as: 'str',
          in: {
            $strLenCP: '$$str'
          }
        }
      }
    };
  },
  [ARRAY_STRING_REDUCTIONS.CONCAT]: function(arr) {
    return {
      $reduce: {
        input: arr,
        initialValue: '',
        in: {
          $concat: ['$$value', '$$this']
        }
      }
    };
  },
  [ARRAY_STRING_REDUCTIONS.LONGEST]: function(arr) {
    return {
      $reduce: {
        input: arr,
        initialValue: {
          $arrayElemAt: [arr, 0]
        },
        in: {
          $cond: {
            if: {
              $gt: [{$strLenCP: '$$this'}, {$strLenCP: '$$value'}]
            },
            then: '$$this',
            else: '$$value'
          }
        }
      }
    };
  },
  [ARRAY_STRING_REDUCTIONS.SHORTEST]: function(arr) {
    return {
      $reduce: {
        input: arr,
        initialValue: {
          $arrayElemAt: [arr, 0]
        },
        in: {
          $cond: {
            if: {
              $lt: [{$strLenCP: '$$this'}, {$strLenCP: '$$value'}]
            },
            then: '$$this',
            else: '$$value'
          }
        }
      }
    };
  }
});

const AGGREGATIONS = Object.freeze({
  [AGGREGATE_FUNCTION_ENUM.COUNT]: function() {
    return {
      $sum: 1
    };
  },
  [AGGREGATE_FUNCTION_ENUM.SUM]: function(field) {
    return {
      $sum: field
    };
  },
  [AGGREGATE_FUNCTION_ENUM.MEAN]: function(field) {
    return {
      $avg: field
    };
  },
  [AGGREGATE_FUNCTION_ENUM.MIN]: function(field) {
    return {
      $min: field
    };
  },
  [AGGREGATE_FUNCTION_ENUM.MAX]: function(field) {
    return {
      $max: field
    };
  },
  [AGGREGATE_FUNCTION_ENUM.STDEV]: function(field) {
    return {
      $stdDevSamp: field
    };
  },
  [AGGREGATE_FUNCTION_ENUM.STDEVP]: function(field) {
    return {
      $stdDevPop: field
    };
  }
});

/**
 * map wrapper around aggregation framework $map. Applies `expr` function
 * to each element in the array `arr`. Returns the agg framework operators
 * to represent the mapping.
 *
 * @param       {Array} arr       array to map over
 * @param       {Function} expr   function to apply to each element in the array
 * @return      {Array}           resulting array
 */
function _map(arr, expr) {
  return {
    $map: {
      input: arr,
      as: 'value',
      in: expr
    }
  };
}


/**
 * Constructs an aggregation pipeline based on the current chart store state.
 *
 * The pipeline consists of 4 main segments, which are
 *
 *   1. Query stages ($match, $sort, $skip, $sample/$limit)
 *   2. Array reduction stages ($unwind and $addFields)
 *   3. Aggregation stages ($group / $bucket)
 *   4. Encoding and flattening stages ($project)
 *
 *
 *                  QUERY        REDUCTIONS    AGGREGATIONS     ENCODING
 *                    |              |              |              |
 * === PIPELINE ===== x ============ x ============ x ============ x =====>
 *                    |              |              |              |
 *                  $match        $unwind        $group         $project
 *                  $sort         $addFields     $bucket
 *                  $skip                        $project
 *              $sample / $limit
 *
 * The segments are computed individually and then concatenated in above
 * order to construct the final pipeline.
 */
class AggPipelineBuilder {

  constructor() {
    this._reset();
  }

  /**
   * clears all segments and aliases to create a new pipeline.
   */
  _reset() {
    this.pipeline = [];
    this.aliases = {};
    this.segments = {
      query: [],
      reduction: [],
      aggregation: [],
      encoding: []
    };
  }

  /**
   * assigns a unique alias name to a field/channel combination, in order
   * to prevent naming collisions during pipeline execution. This mapping
   * is reversed in the final encoding segment of the pipeline.
   *
   * If a field/channel combination has already been mapped, just return
   * the same alias without creating a new one.
   *
   * @param  {String} field     field name
   * @param  {String} channel   channel name
   * @return {String}           a temporary alias name
   */
  _assignUniqueAlias(field, channel) {
    let alias = this._getAlias(field, channel);
    if (!alias) {
      const count = Object.keys(this.aliases).length;
      alias = `__alias_${ count }`;
      this.aliases[`${channel}_${field}`] = alias;
    }
    return alias;
  }

  /**
   * This function returns the alias name given a field and a channel. It
   * is used in _constructEncodingSegment() to look up the correct alias names
   * to build the projection.
   *
   * @param  {String} field     field name
   * @param  {String} channel   channel name
   * @return {String}           the stored alias name
   */
  _getAlias(field, channel) {
    return this.aliases[`${channel}_${field}`];
  }

  /**
   * add $filter, $sort, $skip, $sample or $limit stage to the query segment.
   *
   * @param  {Array} state   chart store state
   */
  _constructQuerySegment(state) {
    const segment = this.segments.query;

    if (!_.isEmpty(state.queryCache)) {
      if (!_.isEmpty(state.queryCache.filter)) {
        segment.push({$match: state.queryCache.filter});
      }
      if (!_.isEmpty(state.queryCache.sort)) {
        segment.push({$sort: state.queryCache.sort});
      }
      if (state.queryCache.skip) {
        segment.push({$skip: state.queryCache.skip});
      }
      if (state.queryCache.sample) {
        segment.push({$sample: {size: state.queryCache.limit || 1000}});
      } else if (state.queryCache.limit) {
        segment.push({$limit: state.queryCache.limit});
      }
    }
  }

  /**
   * Filters out all unwind reductions from the reductions array and builds
   * $unwind stages for the respective fields.
   *
   * @param  {Array} reductions   array of reductions, following the following
   *
   * @return {Array}              array of $unwind stages, might be empty
   */
  _constructUnwindStages(reductions) {
    return _(reductions)
      .filter((reduction) => {
        return reduction.type === ARRAY_GENERAL_REDUCTIONS.UNWIND;
      })
      .map((reduction) => {
        return {$unwind: `$${ reduction.field }`};
      })
      .value();
  }

  /**
   * Takes an array of reductions and creates an aggregation pipeline stage
   * to reduce (possibly nested) arrays to a single scalar value according to
   * the provided reduction functions
   *
   * @param  {Array} reductions    an array of reductions as defined by the
   *                               ChartStore, with the following format:
   *
   *             [
   *               { field: "foo", type: "max", arguments: [] },
   *               { field: "bar.baz" , type: "index", arguments: [3] }
   *             ]
   *
   *                               The reductions are applied outside inwards, above
   *                               example would result in `max(index(field, 3))`.
   *
   * @param {String}  channel      The channel name, used for creating unique alias
   * @return {Object}              an $addFields aggregation stage that converts
   *                               the given field array into a scalar value.
   */
  _constructAccumulatorStage(reductions, channel) {
    let arr;
    let expr;

    reductions = _.filter(reductions, (reduction) => {
      return reduction.type !== ARRAY_GENERAL_REDUCTIONS.UNWIND;
    });

    // compute the array names relative to their parent array name
    if (reductions.length > 0) {
      reductions[0].relativeArrayName = reductions[0].field;
      for (let i = 1; i < reductions.length; i++) {
        const prefix = reductions[i - 1].field;
        reductions[i].relativeArrayName = reductions[i].field.replace(new RegExp(`^${prefix}\.`), '');
      }
    }

    // reverse the array (without modifying original), below code assumes inside->out order
    reductions = reductions.slice().reverse();
    const lastReduction = reductions[reductions.length - 1];

    if (reductions.length === 0) {
      // if no reductions are present, return empty array
      return null;
    }

    if (reductions.length === 1) {
      // with only one reduction, return the reduction applied to the field
      // directly.
      arr = `$${ lastReduction.field }`;
    } else if (reductions.length > 1) {
      // first (inner-most) reduction has no map and applies the reducer expression directly
      arr = `$$value.${ reductions[0].relativeArrayName }`;
      expr = REDUCTIONS[reductions[0].type](arr);

      // second to second last reductions use a map but pass $$value down
      reductions.slice(1, -1).forEach((reduction) => {
        arr = _map(`$$value.${ reduction.relativeArrayName }`, expr);
        expr = REDUCTIONS[reduction.type](arr);
      });

      // last reduction uses the actual field name with a map
      arr = _map(`$${ lastReduction.field }`, expr);
    }
    expr = REDUCTIONS[lastReduction.type](arr);

    // we use $addFields to overwrite the original field name
    const alias = this._assignUniqueAlias(reductions[0].field, channel);
    return {$addFields: {[alias]: expr}};
  }


  /**
   * constructs the pipeline stages to reduce arrays for a single channel.
   * Calls are made to _constructUnwindStages and _constructAccumulatorStage,
   * as both are possible array reductions.
   *
   * @param  {Array} reductions   reductions array for a single channel
   * @param  {String} channel     current channel name
   * @return {Array}              resulting aggregation pipeline
   */
  _reduceArraysPerChannel(reductions, channel) {
    const pipeline = [];
    const unwindStages = this._constructUnwindStages(reductions);
    const accumulatorStage = this._constructAccumulatorStage(reductions, channel);

    // combine pipeline
    pipeline.push.apply(pipeline, unwindStages);
    if (accumulatorStage) {
      pipeline.push(accumulatorStage);
    }
    return pipeline;
  }


  /**
   * array reduction for all encoded channels, calls the _reduceArrayPerChannel
   * method for each channel and combines the results.
   *
   * @param  {Object} state   chart store state
   */
  _constructReductionSegment(state) {
    const segment = this.segments.reduction;

    // return early if no reductions are present
    if (_.isEmpty(state.reductions)) {
      return;
    }

    // array reduction for all channels
    const channels = Object.keys(state.reductions);
    const arrayReductionStages = channels.reduce((_pipeline, channel) => {
      const channelReductions = state.reductions[channel];
      const addToPipeline = this._reduceArraysPerChannel(channelReductions, channel);
      return _pipeline.concat(addToPipeline);
    }, []);
    segment.push.apply(segment, arrayReductionStages);
  }

  /**
   * builds the segment of the pipeline that executes aggregations across
   * documents on the server, instead of the client in vega-lite.
   *
   * The following strategy is used:
   *
   * 1. Identify all dependent fields/measures (channels with "aggregate")
   * 2. Identify all independent fields/dimensions (channels without "aggregate")
   * 3. Create a $group stage and group by (_id) a compound object containing
   *    all dimensions (use aliases because of nested fields), e.g.
   *
   *    {_id: {"__alias_0": "$dim1", __alias_1: "$dim2"}}
   *
   * 4. Add a field (use aliases because of nested fields) to the group
   *    object for each measure, e.g.
   *
   *    {_id: {...}, __alias_2: {$min: "$meas1"}, __alias_3: {$avg: "$meas2"}}
   *
   * 5. Add another stage that unwraps the group key back to top-level fields
   *    and removes the _id key. It also needs to include all measures, e.g.
   *
   *    {
   *      $project: {
   *        _id: 0,                           // exclude _id
   *        "__alias_0": "$_id.__alias_0",    // independent fields/dimensions
   *        "__alias_1": "$_id.__alias_1",
   *        "__alias_2": 1,                   // dependent fields/measures
   *        "__alias_3": 1
   *      }
   *    }
   *
   * @param  {Object} state   chart store state
   */
  _constructAggregationSegment(state) {
    const segment = this.segments.aggregation;

    // step 1, identify measures
    const measures = _(state.channels)
      .pick(encoding => encoding.aggregate)
      .map((encoding, channel) => {
        return [encoding.field, channel];
      })
      .zipObject()
      .value();

    if (Object.keys(measures).length === 0) {
      // no aggregations required, return early
      return;
    }

    // step 2, identify dimensions
    const dimensions = _(state.channels)
      .pick(encoding => !encoding.aggregate)
      .map((encoding, channel) => {
        return [encoding.field, channel];
      })
      .zipObject()
      .value();

    // step 3, create group key for all dimensions
    // note: this also works for zero dimensions, where the group key is
    // the empty object {}. This is correct behavior as the entire dataset
    // is reduced to a single value.
    const groupKey = _(dimensions)
      .map((channel, field) => {
        const alias = this._getAlias(field, channel) || field;
        return [this._assignUniqueAlias(field, channel), `$${alias}`];
      })
      .zipObject()
      .value();

    // step 4, create object of all aggregate functions with aliased names
    const groupAggregates = _(measures)
      .map((channel, field) => {
        const alias = this._getAlias(field, channel) || field;
        return [
          this._assignUniqueAlias(field, channel),
          AGGREGATIONS[state.channels[channel].aggregate](`$${alias}`)
        ];
      })
      .zipObject()
      .value();

    // merge group key and aggregates for the final $group stage
    const groupStage = {$group: _.assign({_id: groupKey}, groupAggregates)};

    // step 5, create $project stage to heist group key fields back to top level
    const projections = {_id: 0};
    // dimensions(their aliases) need to be lifted to the top level
    _.each(dimensions, (channel, field) => {
      const alias = this._getAlias(field, channel);
      projections[alias] = `$_id.${alias}`;
    });
    // measures (their aliases) just need to be included in the projection
    _.each(measures, (channel, field) => {
      projections[this._getAlias(field, channel)] = 1;
    });
    const projectStage = {$project: projections};

    // push the resulting stages into the aggregation segment
    segment.push(groupStage);
    segment.push(projectStage);
  }

  /**
   * The final segment of the aggregation pipeline, to flatten the documents
   * and encode the fields with the channel names. During this process,
   * previously assigned temporary aliases are also resolved.
   *
   * @param  {Object} state   chart store state
   */
  _constructEncodingSegment(state) {
    const segment = this.segments.encoding;

    // project encoded fields to top-level using their channel name
    if (!_.isEmpty(state.channels)) {
      const projectStage = _.reduce(_.pick(state.channels, _.isObject), (_project, encoding, channel) => {
        // check if the field name has an alias, otherwise use original field name
        const alias = this._getAlias(encoding.field, channel) || encoding.field;
        _project[channel] = `$${ alias }`;
        return _project;
      }, {});

      // drop _id in result
      projectStage._id = 0;
      segment.push({$project: projectStage});
    }
  }


  /**
   * combines all segments together to a single pipeline.
   *
   * @return {Array}   final aggregation pipeline
   */
  _combineSegments() {
    const segments = Object.keys(this.segments);
    const pipeline = [];
    segments.forEach((segment) => {
      pipeline.push.apply(pipeline, this.segments[segment]);
    });
    // make a deep copy for storage
    this.pipeline = _.cloneDeep(pipeline);
    return pipeline;
  }

  /**
   * main entry point to construct an aggregation pipeline given a chart
   * store state.
   *
   * @param  {Object} state   chart store state
   * @return {Array}          full aggregation pipeline
   */
  constructPipeline(state) {
    this._reset();

    // call all segment constructors individually
    this._constructQuerySegment(state);
    this._constructReductionSegment(state);
    this._constructAggregationSegment(state);
    this._constructEncodingSegment(state);

    return this._combineSegments();
  }
}

module.exports = AggPipelineBuilder;
