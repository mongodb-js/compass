const Reflux = require('reflux');
const EJSON = require('mongodb-extended-json');
const Action = require('../action/index-actions');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const SchemaStore = require('../../../schema/lib/store');

/**
 * The reflux store for storing the form for creating indexes.
 */
const CreateIndexStore = Reflux.createStore({

  /**
   * Initialize the index fields store.
   */
  init: function() {
    this.listenTo(SchemaStore, this.loadFields);
    this.listenTo(Action.clearForm, this.clearForm);
    this.listenTo(Action.triggerIndexCreation, this.triggerIndexCreation);
    this.listenTo(Action.updateField, this.updateField);
    this.listenTo(Action.updateOption, this.updateOption);
    this.schemaFields = []; // fields in the current schema
    this.fields = []; // fields and types for new index
    this.options = {}; // options for new index
  },

  /*
   * Reset fields and options and send both to listeners.
   */
  clearForm: function() {
    this.fields = [];
    this.options = {};
    this.sendValues();
  },

  /*
   * Transform the data to fit Data Service specifications and trigger index creation.
   */
  triggerIndexCreation: function() {
    const spec = {};
    this.fields.forEach(field => {
      let type = field.type;
      if (type === '1 (asc)') type = 1;
      if (type === '-1 (desc)') type = -1;
      spec[field.name] = type;
    });

    const options = {};
    for (const key of Object.keys(this.options)) {
      const option = this.options[key];
      if (option.value) {
        if (option.param) {
          // check for special parameters
          if (key === 'ttl') {
            options.expireAfterSeconds = Number(option.param);
          } else if (key === 'partialFilterExpression') {
            try {
              const parsed = EJSON.parse(option.param);
              options[key] = parsed;
            } catch (err) { // validation error
              Action.updateStatus('error', String(err));
              // stop creation
              return;
            }
          } else {
            options[key] = option.param;
          }
        } else { // if no param value
          options[key] = option.value;
        }
      }
    }

    Action.updateStatus('inProgress');
    Action.createIndex(NamespaceStore.ns, spec, options);
  },

  /**
   * Parse and load the schema fields from the schema store.
   *
   * @param {Object} schemaStoreState - The state of the schema store (from schema package).
   */
  loadFields: function(schemaStoreState) {
    let schemaFields = [];
    if (schemaStoreState.schema) {
      schemaFields = schemaStoreState.schema.fields;
    }
    schemaFields = this._parseSchemaFields(schemaFields, '');
    // don't allow users to make indexes on _id
    this.schemaFields = schemaFields.filter(name => name !== '_id');
    this.sendValues();
  },

  /**
   * Recursivey find all possible index paths in a schema's fields (assumes no duplicate paths).
   *
   * @param {Array} fields - The fields of a schema.
   * @param {string} prefix - The path to the current fields
   *
   * @returns {Array} The possible index paths in a schema.
   */
  _parseSchemaFields: function(fields, prefix) {
    let possiblePaths = [];

    // add each field's path to field set
    let path = '';
    for (const field of fields) {
      path = prefix + field.name;
      possiblePaths.push(path);

      // recursively search sub documents
      for (const type of field.types) {
        if (type.name === 'Document') {
          // append . to current path so nested documents have proper prefix
          possiblePaths = possiblePaths.concat(this._parseSchemaFields(type.fields, path + '.'));
        }
      }
    }
    return possiblePaths;
  },

  /**
   * Send fields, options, and schema fields to listeners.
   */
  sendValues: function() {
    this.trigger(this.fields, this.options, this.schemaFields);
  },

  /**
   * Add or remove field name and type from store and send updated form to listeners.
   *
   * @param {string} name - The index field name.
   * @param {string} type - The index type.
   * @param {string} action - The action to take (either add or drop).
   */
  updateField: function(name, type, action) {
    if (action === 'add') { // add field if not already added
      if (!this.fields.some(field => field.name === name)) {
        this.fields.push({name: name, type: type});
      }
    } else if (action === 'drop') { // remove field
      this.fields = this.fields.filter(field => field.name !== name || field.type !== type);
    }
    this.sendValues();
  },

  /**
   * Update option or parameter value in the store and send updated form to listeners.
   *
   * @param {string} option - The option name.
   * @param {string} value - The option value.
   * @param {boolean} isParam - The flag for option parameters.
   */
  updateOption: function(option, value, isParam) {
    if (isParam) { // update parameter value in option form
      if (!value) value = '';
      this.options[option].param = String(value);
    } else { // update main value in option form
      if (!this.options[option]) this.options[option] = {name: option};
      this.options[option].value = value;
    }
    this.sendValues();
  }
});

module.exports = CreateIndexStore;
