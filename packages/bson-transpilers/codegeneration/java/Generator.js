/* eslint complexity: 0 */
const {doubleQuoteStringify, removeQuotes} = require('../../helper/format');
const {
  BsonCompilersRuntimeError,
  BsonCompilersUnimplementedError
} = require('../../helper/error');

/**
 * @param {class} superClass - where the `visitX` methods live.
 * @returns {Generator}
 */
module.exports = (superClass) => class ExtendedVisitor extends superClass {
  constructor() {
    super();
    this.new = 'new ';
    this.regexFlags = {
      i: 'i', m: 'm', u: 'u', y: '', g: ''
    };
    this.bsonRegexFlags = {
      i: 'i', m: 'm', x: 'x', s: 's', l: 'l', u: 'u'
    };
    // Operations that take the field name as an argument
    this.field_opts = [
      'gt', 'lt', 'lte', 'gte', 'eq', 'ne', 'nin', 'in', 'not', 'exists',
      'type', 'all', 'size', 'elemMatch', 'mod', 'regex',
      'sum', 'avg', 'first', 'last', 'max', 'min', 'push', 'addToSet',
      'stdDevSamp', 'stdDevPop',
      'bitsAllSet', 'bitsAllClear', 'bitsAnySet', 'bitsAnyClear',
      'geoWithin', 'geoIntersects', 'near', 'nearSphere'
    ];
    // Operations that convert by {$op: value} => op(value)
    this.opts = [
      'match', 'skip', 'limit', 'out', 'sortByCount', 'count', 'or', 'nor',
      'and'
    ];
    // Operations split by their import class
    this.builderImports = [
      // Filter ops
      [
        'all', 'and', 'bitsAllClear', 'bitsAllSet', 'bitsAnyClear', 'bitsAnySet',
        'elemMatch', 'eq', 'exists', 'expr', 'geoIntersects', 'geoWithin',
        'geoWithinBox', 'geoWithinCenter', 'geoWithinCenterSphere', 'geoWithinPolygon',
        'gt', 'gte', 'in', 'lt', 'lte', 'mod', 'ne', 'near', 'nearSphere', 'nin',
        'nor', 'not', 'or', 'regex', 'size', 'text', 'type', 'where', 'options'
      ],
      // Agg ops
      [
        'addFields', 'bucket', 'bucketAuto', 'count', 'facet', 'graphLookup',
        'group', 'limit', 'lookup', 'match', 'out', 'project', 'replaceRoot',
        'sample', 'skip', 'sort', 'sortByCount', 'unwind'
      ],
      // Accumulator ops
      [
        'addToSet', 'avg', 'first', 'last', 'max', 'min', 'push',
        'stdDevPop', 'stdDevSamp', 'sum'
      ]
    ].reduce((obj, list, index) => {
      list.forEach((op) => {
        obj[op] = index + 300;
      });
      return obj;
    }, {});
  }

  /**
   * Ignore the new keyword because JS could either have it or not, but we always
   * need it in Java so we'll add it when we call constructors.
   * TODO: do we ever need the second arguments expr?
   *
   * Child nodes: singleExpression arguments?
   *
   * @param {NewExpressionContext} ctx
   * @return {String}
   */
  emitNew(ctx) {
    const expr = this.visit(ctx.singleExpression());
    ctx.type = ctx.singleExpression().type;
    return expr;
  }

  /**
   * Special cased because different target languages need different info out
   * of the constructed date.
   *
   * @param {FuncCallExpressionContext} ctx
   * @param {Date} date
   * @return {String}
   */
  emitDate(ctx, date) {
    let toStr = (d) => d;
    if (!ctx.wasNew && !ctx.getText().includes('ISODate')) {
      ctx.type = this.Types._string;
      toStr = (d) => `new SimpleDateFormat("EEE MMMMM dd yyyy HH:mm:ss").format(${d})`;
      this.requiredImports[201] = true;
    }
    if (date === undefined) {
      return toStr('new java.util.Date()');
    }
    return toStr(`new java.util.Date(${date.getTime()}L)`);
  }
  emitISODate(ctx) {
    return this.emitDate(ctx);
  }

  /**
   * Special cased because don't want 'new' here.
   *
   * @param {FuncCallExpressionContext} ctx
   * @param {String} str - the number as a string.
   * @return {String}
   */
  emitDecimal128(ctx, str) {
    return `Decimal128.parse(${doubleQuoteStringify(str)})`;
  }
  emitNumberDecimal(ctx, str) {
    return `Decimal128.parse(${doubleQuoteStringify(str)})`;
  }
  emitLong(ctx, str) {
    return `${str}L`;
  }

  /**
   * Accepts date or number, if date then don't convert to date.
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitObjectIdCreateFromTime(ctx) {
    ctx.type = 'createFromTime' in this.Symbols.ObjectId.attr ?
      this.Symbols.ObjectId.attr.createFromTime :
      this.Symbols.ObjectId.attr.fromDate;
    const argList = ctx.arguments().argumentList();
    const args = this.checkArguments(ctx.type.args, argList);
    const template = ctx.type.template ? ctx.type.template() : '';
    if (argList.singleExpression()[0].type.id === 'Date') {
      return `${template}${ctx.type.argsTemplate('', args[0])}`;
    }
    return `${template}${ctx.type.argsTemplate(
      '', `new java.util.Date(${args[0]})`)}`;
  }


  /**
   * Emit an "idiomatic" filter or aggregation, meaning use the builders
   * instead of a regular object if possible.
   *
   * @param {ObjectLiteralContext} ctx
   * @return {String}
   */
  emitIdiomaticObjectLiteral(ctx) {
    ctx.type = this.Types._object;
    ctx.indentDepth = this.getIndentDepth(ctx) + 1;
    let multiOps = false;
    let args = '';
    if (ctx.propertyNameAndValueList()) {
      const properties = ctx.propertyNameAndValueList().propertyAssignment();
      args = properties.map((pair) => {
        const field = this.visit(pair.propertyName());
        if (field.startsWith('$')) {
          const op = field.substr(1);
          if (this.builderImports[op]) {
            this.requiredImports[this.builderImports[op]].push(op);
          }
          if (op === 'regex') {
            multiOps = true;
          }
          if (`handle${op}` in this) {
            return this[`handle${op}`](
              pair.singleExpression().getChild(0), op, ctx
            );
          }
          if (this.field_opts.indexOf(op) !== -1) {
            // Assert that this isn't the top-level object
            if (!('propertyName' in ctx.parentCtx.parentCtx)) {
              throw new BsonCompilersRuntimeError(`$${op} cannot be top-level`);
            }
            return this.handleFieldOp(pair.singleExpression(), op, ctx);
          }
          if (this.opts.indexOf(op) !== -1) {
            return `${field.substr(1)}(${this.visit(pair.singleExpression())})`;
          }
        }
        const value = this.visit(pair.singleExpression());
        // $-op filters need to rewind a level
        if (this.isFilter(pair.singleExpression().getChild(0))) {
          return value;
        }
        this.requiredImports[300].push('eq');
        return `eq(${doubleQuoteStringify(field)}, ${value})`;
      });
      if (args.length > 1 && !multiOps) {
        this.requiredImports[300].push('and');
        return `and(${args.join(', ')})`;
      }
      return args[0];
    }
    this.requiredImports[10] = true;
    return 'new Document()';
  }

  /**
   * Generates idiomatic java for a $-operator that takes the field name
   * as the first argument. i.e. { field: { $op: value } } => op(field, value)
   *
   * @param {ObjectLiteralContext} ctx - The field of the $-op
   * @param {String} op - The $-op
   * @param {ObjectLiteralContext} parent - The parent object's ctx
   * @returns {String}
   */
  handleFieldOp(ctx, op, parent) {
    const parentField = this.visit(parent.parentCtx.parentCtx.propertyName());
    return `${op}(${doubleQuoteStringify(parentField)}, ${this.visit(ctx)})`;
  }

  /**
   * Determines if an object has a subfield that is a $-op.
   *
   * @param {ObjectLiteralContext} ctx - The field of the $-op
   * @return {Boolean}
   */
  isFilter(ctx) {
    if ('propertyNameAndValueList' in ctx && ctx.propertyNameAndValueList()) {
      const properties = ctx.propertyNameAndValueList().propertyAssignment();
      for (let i = 0; i < properties.length; i++) {
        const pair = properties[i];
        const field = this.visit(pair.propertyName());
        if (this.field_opts.indexOf(field.substr(1)) !== -1) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Generates idiomatic java for a $-operator that requires a document that has
   * a single subfield whose value gets set to the builder argument.
   * { $op: { $subfield: value } } => op(value)
   *
   * @param {ObjectLiteralContext} ctx - The field of the $-op
   * @param {String} op - The name of the $-op.
   * @param {String} subfield - The name of the subfield to require.
   * @param {Boolean} idiomatic - If the value should be generated as idiomatic.
   * @return {String}
   */
  handleSingleSubfield(ctx, op, subfield, idiomatic) {
    const properties = this.assertIsNonemptyObject(ctx, op);
    let value = '';

    properties.forEach((pair) => {
      const field = this.visit(pair.propertyName());
      if (field === subfield) {
        this.idiomatic = idiomatic;
        value = this.visit(pair.singleExpression());
        this.idiomatic = true;
      } else {
        throw new BsonCompilersRuntimeError(
          `Unrecognized option to $${op}: ${field}`
        );
      }
    });
    if (value === '') {
      throw new BsonCompilersRuntimeError(
        `Missing option '${subfield}' in $${op}`
      );
    }
    return `${op}(${value})`;
  }

  /**
   * Generates idiomatic java for a $-operator that has some required options
   * and some options that get rolled into an Options object.
   *
   * { $op: { required: reqVal, optional: optionalVal } =>
   * op(reqVal, new Options.optional())
   *
   * @param {ObjectLiteralContext} ctx - The field of the $-op
   * @param {String} op - The name of the $-op.
   * @param {Array} reqOpts - The list of required options.
   * @param {Array} optionalOpts - The list of optional options.
   * @param {Object} transforms - An mapping of original name to transformed
   * name. Includes both optional options and the Options object.
   * @return {string}
   */
  handleOptionsObject(ctx, op, reqOpts, optionalOpts, transforms) {
    const properties = this.assertIsNonemptyObject(ctx, op);
    const fields = {};

    properties.forEach((pair) => {
      const field = this.visit(pair.propertyName());
      if (reqOpts.indexOf(field) !== -1 || optionalOpts.indexOf(field) !== -1) {
        fields[field] = this.visit(pair.singleExpression());
      } else {
        throw new BsonCompilersRuntimeError(
          `Unrecognized option to $${op}: ${field}`
        );
      }
    });
    reqOpts.map((f) => {
      if (!(f in fields)) {
        throw new BsonCompilersRuntimeError(`Missing option '${f}' in $${op}`);
      }
    });

    let options = '';
    if (Object.keys(fields).length > reqOpts.length) {
      this.requiredImports[306].push(transforms[op]);

      options = `, new ${transforms[op]}()${Object.keys(fields).filter((f) => {
        return optionalOpts.indexOf(f) !== -1;
      }).map((k) => {
        if (transforms !== undefined && k in transforms) {
          return transforms[k](fields[k]);
        }
        return `.${k}(${fields[k]})`;
      }).join('')}`;
    }

    return `${op}(${reqOpts.map((f) => {
      return fields[f];
    }).join(', ')}${options})`;
  }

  /**
   * Generates idiomatic java for a $-operator that has some required options
   * and then multiple arbitrary fields.
   *
   * { $op: { required: reqVal, opt1: v1, opt2: v2...} } => op(reqVal, v1, v2...)
   * @param {ObjectLiteralContext} ctx - The field of the $-op
   * @param {String} op - The name of the $-op.
   * @param {Array} reqOpts - The list of required options.
   * @param {Function} transform - A function that takes in the option name and
   * the value, then returns a string with the correct formatting.
   * @param {Boolean} idiomatic - If the value should be generated as idiomatic.
   * @return {string}
   */
  handleMultipleSubfields(ctx, op, reqOpts, transform, idiomatic) {
    const properties = this.assertIsNonemptyObject(ctx, op);
    const req = [];
    const fields = {};

    properties.forEach((pair) => {
      const field = this.visit(pair.propertyName());
      if (reqOpts.indexOf(field) !== -1) {
        req.push(this.visit(pair.singleExpression()));
      } else {
        this.idiomatic = idiomatic;
        fields[field] = this.visit(pair.singleExpression());
        this.idiomatic = true;
      }
    });
    if (req.length !== reqOpts.length) {
      throw new BsonCompilersRuntimeError(
        `Required option missing from ${op}`
      );
    }

    const args = req.concat(Object.keys(fields).map((f) => {
      return transform(f, fields[f]);
    }));
    return `${op}(${args.join(', ')})`;
  }

  /**
   * Method for handling an idiomatic $project.
   * ctx must be a non-empty document.
   *
   * @param {ObjectLiteralContext} ctx
   * @return {String}
   */
  handleproject(ctx) {
    // Eventual todo: slice and elemMatch
    const properties = this.assertIsNonemptyObject(ctx, 'project');
    const fields = {};

    properties.forEach((pair) => {
      const field = this.visit(pair.propertyName());
      const original = pair.singleExpression().getText();
      if (original === 'true' || original === '1') {
        if (field !== '_id') {
          // Skip because ID is included by default
          fields.includes = !fields.includes ?
            `include(${doubleQuoteStringify(field)}` :
            `${fields.includes}, ${doubleQuoteStringify(field)}`;
          this.requiredImports[303].push('include');
        }
      } else if (original === 'false' || original === '0') {
        if (field !== '_id') {
          fields.excludes = !fields.excludes ?
            `exclude(${doubleQuoteStringify(field)}` :
            `${fields.excludes}, ${doubleQuoteStringify(field)}`;
          this.requiredImports[303].push('exclude');
        } else {
          fields.excludeId = 'excludeId()';
          this.requiredImports[303].push('excludeId');
        }
      } else {
        const value = this.visit(pair.singleExpression());
        fields.computed = !fields.computed ?
          `computed(${doubleQuoteStringify(field)}, ${value})` :
          `${fields.computed}, computed(${doubleQuoteStringify(field)}, ${value})`;
        this.requiredImports[303].push('computed');
      }
    });

    if (fields.includes) {
      fields.includes = `${fields.includes})`;
    }
    if (fields.excludes) {
      fields.excludes = `${fields.excludes})`;
    }
    const elements = Object.values(fields);
    let projectStr;
    if (elements.length === 1) {
      projectStr = elements[0];
    } else {
      projectStr = `fields(${elements.join(', ')})`;
      this.requiredImports[303].push('fields');
    }
    return `project(${projectStr})`;
  }

  /**
   * Method for handling an idiomatic $not.
   *
   * { field: { $not: {$op: value} } } => not(op(field, value))
   *
   * ctx must be a non-empty document.
   *
   * @param {ObjectLiteralExpressionContext} ctx - the ctx of the value of the
   * $not field
   * @param {String} op - the operation, which in this case is "not"
   * @param {ObjectLiteralExpressionContext} parent - ctx of parent document.
   * @return {String}
   */
  handlenot(ctx, op, parent) {
    const properties = this.assertIsNonemptyObject(ctx, op);
    const val = properties[0].singleExpression();
    const innerop = this.visit(properties[0].propertyName()).substr(1);
    this.requiredImports[300].push(innerop);
    const inner = this.handleFieldOp(val, innerop, parent);
    return `${op}(${inner})`;
  }

  /**
   * Method for handling an idiomatic $mod.
   *
   * { field: { $mod: [arr1, arr2] } } => mod(field, arr1, arr2)
   *
   * ctx must be an array of length 2.
   *
   * @param {ObjectLiteralExpressionContext} ctx - the ctx of the value of the
   * $mod field
   * @param {String} op - the operation, which in this case is "mod"
   * @param {ObjectLiteralExpressionContext} parent - ctx of parent document.
   * @return {String}
   */
  handlemod(ctx, op, parent) {
    if (!('elementList' in ctx) ||
      !ctx.elementList() ||
      ctx.elementList().singleExpression().length !== 2) {
      throw new BsonCompilersRuntimeError(
        '$mod requires an array of 2-elements'
      );
    }
    const parentField = this.visit(parent.parentCtx.parentCtx.propertyName());
    const inner = ctx.elementList().singleExpression().map((f) => {
      return this.visit(f);
    });
    return `${op}(${doubleQuoteStringify(parentField)}, ${inner.join(', ')})`;
  }

  /**
   * Method for handling an idiomatic $regex.
   *
   * { field: { $regex: regexstr, $options?: optsstr } } =>
   * regex(regexstr, optsstr?)
   *
   * ctx must be a string
   *
   * @param {ObjectLiteralExpressionContext} ctx - the ctx of the value of the
   * $regex field
   * @param {String} op - the operation, which in this case is "regex"
   * @param {ObjectLiteralExpressionContext} parent - ctx of parent document.
   * @return {String}
   */
  handleregex(ctx, op, parent) {
    const parentField = this.visit(parent.parentCtx.parentCtx.propertyName());
    const regex = {r: '', o: ''};

    const properties = parent.propertyNameAndValueList().propertyAssignment();
    properties.forEach((pair) => {
      const field = this.visit(pair.propertyName());
      if (field === '$regex') {
        regex.r = this.visit(pair.singleExpression());
      }
      if (field === '$options') {
        regex.o = `, ${this.visit(pair.singleExpression())}`;
      }
    });
    return `${op}(${doubleQuoteStringify(parentField)}, ${regex.r}${regex.o})`;
  }
  handleoptions() {
    return '';
  }

  /**
   * Method for handling an idiomatic $where.
   *
   * { $where: <function def> } => where(<function as string>)
   *
   * @param {ObjectLiteralExpressionContext} ctx - the ctx of the value of the
   * $where field
   * @return {String}
   */
  handlewhere(ctx) {
    let text;
    if (!('getParent' in ctx)) {
      text = ctx.getText();
    } else {
      text = ctx.getParent().getText();
    }
    return `where(${doubleQuoteStringify(text)})`;
  }

  /**
   * Method for handling an idiomatic $sort.
   *
   * { $sort: { f1: 1, f2: -1, f3: { $meta: 'textScore' } } } =>
   * sort(ascending(f1), descending(f2), metaTextScore(f3))
   *
   * @param {ObjectLiteralExpressionContext} ctx - the ctx of the value of the
   * @return {string}
   */
  handlesort(ctx) {
    const properties = this.assertIsNonemptyObject(ctx, 'sort');
    const fields = [];

    properties.forEach((pair) => {
      const field = this.visit(pair.propertyName());
      const original = pair.singleExpression().getText();
      if (original === '1') {
        fields.push(`ascending(${doubleQuoteStringify(field)})`);
        this.requiredImports[304].push('ascending');
      } else if (original === '-1') {
        fields.push(`descending(${doubleQuoteStringify(field)})`);
        this.requiredImports[304].push('descending');
      } else if (original.match(
          new RegExp(/{(?:'|")?\$meta(?:'|")?:(?:'|")textScore*(?:'|")}/)
        )) {
        fields.push(`metaTextScore(${doubleQuoteStringify(field)})`);
        this.requiredImports[304].push('metaTextScore');
      } else {
        throw new BsonCompilersRuntimeError(
          '$sort key ordering must be specified using a number or ' +
          '{$meta: \'textScore\'}'
        );
      }
    });
    let sortStr;
    if (fields.length > 1) {
      sortStr = `orderBy(${fields.join(', ')})`;
      this.requiredImports[304].push('orderBy');
    } else {
      sortStr = fields[0];
    }
    return `sort(${sortStr})`;
  }

  handlegeoWithin(ctx, op, parent) {
    this.requiredImports[300].splice(
      this.requiredImports[300].indexOf('geoWithin'), 1
    );
    const properties = this.assertIsNonemptyObject(ctx, op);
    const parentField = doubleQuoteStringify(
      this.visit(parent.parentCtx.parentCtx.propertyName())
    );
    const fields = {};

    properties.forEach((pair) => {
      const field = this.visit(pair.propertyName());
      fields[field] = pair.singleExpression();
    });

    if (Object.keys(fields).length !== 1) {
      throw new BsonCompilersRuntimeError(
        '$geoWithin takes an object with only 1 field'
      );
    }
    const key = Object.keys(fields)[0];
    switch (key) {
      case ('$geometry'): {
        this.requiredImports[300].push('geoWithin');
        return `geoWithin(${parentField}, ${this.handlegeometry(fields[key])})`;
      }
      case ('$box'): {
        this.requiredImports[300].push('geoWithinBox');
        return `geoWithinBox(${parentField}, ${
          this.combineCoordinates(fields[key], 2, '', true, (p) => {
            return this.combineCoordinates(p, 2, '', true, (p2) => {
              return this.visit(p2);
            });
          })})`;
      }
      case ('$polygon'): {
        this.requiredImports[300].push('geoWithinPolygon');
        return `geoWithinPolygon(${parentField}, ${this.visit(fields[key])})`;
      }
      case ('$centerSphere'):
      case ('$center'): {
        const array = this.assertIsNonemptyArray(fields[key]);
        if (array.length !== 2) {
          throw new BsonCompilersRuntimeError(`${key} takes array of length 2`);
        }
        const coordinates = this.combineCoordinates(
          array[0], 2, '', true, (p) => { return this.visit(p); }
        );
        const geoop = `geoWithin${key[1].toUpperCase()}${
          key.substr(2)
        }`;
        this.requiredImports[300].push(geoop);
        return `${geoop}(${parentField}, ${coordinates}, ${this.visit(array[1])})`;
      }
      default: {
        throw new BsonCompilersRuntimeError(
          `unrecognized option ${key} to $geoWithin`
        );
      }
    }
  }

  handlenear(ctx, op, parent) {
    const properties = this.assertIsNonemptyObject(ctx, op);
    const parentField = doubleQuoteStringify(
      this.visit(parent.parentCtx.parentCtx.propertyName())
    );
    const fields = {};

    properties.forEach((pair) => {
      const field = this.visit(pair.propertyName());
      fields[field] = pair.singleExpression();
    });

    ['$geometry', '$minDistance', '$maxDistance'].map((k) => {
      if (!(k in fields)) {
        throw new BsonCompilersRuntimeError(
          `Missing required field ${k} in $${op}`
        );
      }
    });
    if (Object.keys(fields).length !== 3) {
      throw new BsonCompilersRuntimeError(
        `Too many fields to $${op}`
      );
    }
    return `${op}(${parentField}, ${
      this.handlegeometry(fields.$geometry)
    }, ${this.visit(fields.$maxDistance)}, ${
      this.visit(fields.$minDistance)
    })`;
  }

  handlenearSphere(ctx, op, parent) {
    return this.handlenear(ctx, op, parent);
  }

  generateposition(ctx) {
    const coordinates = this.assertIsNonemptyArray(ctx, 'geometry');
    if (coordinates.length !== 2) {
      throw new BsonCompilersRuntimeError(
        'Position must be 2 coordinates'
      );
    }
    this.requiredImports[305].push('Position');
    return `new Position(${
      this.visit(coordinates[0])}, ${this.visit(coordinates[1])
    })`;
  }

  assertIsNonemptyArray(ctx, op) {
    if (!('arrayLiteral' in ctx) ||
      !('elementList' in ctx.arrayLiteral())) {
      throw new BsonCompilersRuntimeError(
        `$${op} requires a non-empty array`
      );
    }
    return ctx.arrayLiteral().elementList().singleExpression();
  }
  assertIsNonemptyObject(ctx, op) {
    if ('objectLiteral' in ctx) {
      ctx = ctx.objectLiteral();
    }
    if (!('propertyNameAndValueList' in ctx) ||
      !ctx.propertyNameAndValueList()) {
      throw new BsonCompilersRuntimeError(
        `$${op} requires a non-empty document`
      );
    }
    return ctx.propertyNameAndValueList().propertyAssignment();
  }

  combineCoordinates(ctx, length, className, noArray, innerFunc) {
    if (!noArray) {
      this.requiredImports[9] = true;
    }
    const points = this.assertIsNonemptyArray(ctx, 'geometry');
    if (points.length < length) {
      throw new BsonCompilersRuntimeError(
        `${
          className ? className : '$geometry inner array'
        } must have at least ${length} elements (has ${points.length})`
      );
    }
    let pointstr = points.map((p) => {
      if (!innerFunc) {
        return this.generateposition(p);
      }
      return innerFunc(p);
    }).join(', ');
    pointstr = noArray ? pointstr : `Arrays.asList(${pointstr})`;
    if (!className) {
      return pointstr;
    }
    this.requiredImports[305].push(className);
    return `new ${className}(${pointstr})`;
  }

  generatepoint(ctx) {
    return `new Point(${this.generateposition(ctx)})`;
  }

  generatemultipoint(ctx) {
    return this.combineCoordinates(ctx, 1, 'MultiPoint');
  }

  generatelinestring(ctx) {
    return this.combineCoordinates(ctx, 2, 'LineString');
  }

  generatemultilinestring(ctx) {
    return this.combineCoordinates(
      ctx,
      1,
      'MultiLineString',
      false,
      (p) => { return this.combineCoordinates(p, 2); }
    );
  }

  generatepolygon(ctx) {
    const polyCoords = this.combineCoordinates(
      ctx,
      1,
      'PolygonCoordinates',
      true,
      (p) => { return this.combineCoordinates(p, 4); }
    );
    return `new Polygon(${polyCoords})`;
  }

  generatemultipolygon(ctx) {
    return this.combineCoordinates(
      ctx,
      1,
      'MultiPolygon',
      false,
      (p) => {
        return this.combineCoordinates(
          p,
          1,
          'PolygonCoordinates',
          true,
          (p2) => { return this.combineCoordinates(p2, 4); }
        );
      }
    );
  }

  generategeometrycollection(ctx) {
    const geometries = this.assertIsNonemptyArray(ctx, 'geometry');
    return `new GeometryCollection(Arrays.asList(${
      geometries.map((g) => {
        if (!('objectLiteral' in g) || !g.objectLiteral()) {
          throw new BsonCompilersRuntimeError(
            '$GeometryCollection requires objects'
          );
        }
        return this.handlegeometry(g.objectLiteral());
      }).join(', ')
    }))`;
  }

  handlegeometry(ctx) {
    const properties = this.assertIsNonemptyObject(ctx, 'geometry');
    const fields = {};

    properties.forEach((pair) => {
      const field = this.visit(pair.propertyName());
      if (field === 'type') {
        fields.type = removeQuotes(this.visit(pair.singleExpression()));
      } else if (field === 'coordinates') {
        fields.coordinates = pair.singleExpression();
      } else if (field === 'crs') {
        throw new BsonCompilersUnimplementedError(
          'Coordinate reference systems not currently supported'
        );
      } else {
        throw new BsonCompilersRuntimeError(
          `Unrecognized option to $geometry: ${field}`
        );
      }
    });
    if (!fields.type || !fields.coordinates) {
      throw new BsonCompilersRuntimeError(
        'Missing option to $geometry'
      );
    }
    if (!('arrayLiteral' in fields.coordinates) ||
        !('elementList' in fields.coordinates.arrayLiteral())) {
      throw new BsonCompilersRuntimeError(
        'Invalid coordinates option for $geometry'
      );
    }
    if (`generate${fields.type.toLowerCase()}` in this) {
      this.requiredImports[305].push(fields.type);
      return this[`generate${fields.type.toLowerCase()}`](fields.coordinates);
    }
    throw new BsonCompilersRuntimeError(
      `Unrecognized GeoJSON type "${fields.type}"`
    );
  }

  handlesample(ctx) {
    return this.handleSingleSubfield(ctx, 'sample', 'size', true);
  }
  handlereplaceRoot(ctx) {
    return this.handleSingleSubfield(ctx, 'replaceRoot', 'newRoot', false);
  }
  handlegraphLookup(ctx) {
    return this.handleOptionsObject(
      ctx,
      'graphLookup',
      ['from', 'startWith', 'connectFromField', 'connectToField', 'as'],
      ['maxDepth', 'depthField', 'restrictSearchWithMatch'],
      { graphLookup: 'GraphLookupOptions' }
    );
  }
  handlelookup(ctx) {
    return this.handleOptionsObject(
      ctx,
      'lookup',
      ['from', 'localField', 'foreignField', 'as'],
      [],
      { lookup: 'LookupOptions' }
    );
  }
  handlebucket(ctx) {
    return this.handleOptionsObject(
      ctx,
      'bucket',
      ['groupBy', 'boundaries'],
      ['default', 'output'],
      {
        bucket: 'BucketOptions',
        default: (k) => { return `.defaultBucket(${k})`; }
      }
    );
  }
  handlebucketAuto(ctx) {
    return this.handleOptionsObject(
      ctx,
      'bucketAuto',
      ['groupBy', 'buckets'],
      ['granularity', 'output'],
      {
        bucketAuto: 'BucketAutoOptions',
        granularity: (k) => {
          return `.granularity(BucketGranularity.fromString(${k}))`;
        }
      }
    );
  }
  handletext(ctx) {
    return this.handleOptionsObject(
      ctx,
      'text',
      ['$search'],
      ['$language', '$caseSensitive', '$diacriticSensitive'],
      {
        text: 'TextSearchOptions',
        $language: (k) => { return `.language(${k})`; },
        $caseSensitive: (k) => { return `.caseSensitive(${k})`; },
        $diacriticSensitive: (k) => { return `.diacriticSensitive(${k})`; }
      }
    );
  }
  handleunwind(ctx) {
    const copy = this.deepCopyRequiredImports();
    const value = this.visit(ctx.parentCtx);
    this.requiredImports = copy;
    if (ctx.parentCtx.type.id === '_string') {
      return `unwind(${value})`;
    }
    return this.handleOptionsObject(
      ctx,
      'unwind',
      ['path'],
      ['includeArrayIndex', 'preserveNullAndEmptyArrays'],
      { unwind: 'UnwindOptions' }
    );
  }
  handlegroup(ctx) {
    return this.handleMultipleSubfields(ctx, 'group', ['_id'], (f, v) => {
      return v;
    }, true);
  }
  handlefacet(ctx) {
    this.requiredImports[306].push('Facet');
    return this.handleMultipleSubfields(ctx, 'facet', [], (f, v) => {
      return `new Facet(${doubleQuoteStringify(f)}, ${v})`;
    }, true);
  }
  handleaddFields(ctx) {
    this.requiredImports[306].push('Field');
    return this.handleMultipleSubfields(ctx, 'addFields', [], (f, v) => {
      return `new Field(${doubleQuoteStringify(f)}, ${v})`;
    }, false);
  }
};
