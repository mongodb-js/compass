'use strict';

const ComponentRegistry = require('./lib/component-registry');
module.exports = ComponentRegistry;
module.exports.ComponentRegistry = ComponentRegistry;
module.exports.Action = require('./lib/action');
module.exports.Flexbox = require('./lib/component/flexbox');
module.exports.FormGroup = require('./lib/component/form-group');
module.exports.FormInput = require('./lib/component/form-input');
module.exports.FormItem = require('./lib/component/form-item');
module.exports.FormOption = require('./lib/component/form-option');
module.exports.FormSelect = require('./lib/component/form-select');
module.exports.Form = require('./lib/component/form');
module.exports.GroupItem = require('./lib/component/group-item');
module.exports.Group = require('./lib/component/group');
module.exports.GroupedList = require('./lib/component/grouped-list');
