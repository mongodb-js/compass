const Reflux = require('reflux');
const app = require('hadron-app');
const EJSON = require('mongodb-extended-json');
const Action = require('../action/index-actions');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:ddl:index:store');

const ERRORS = {
  duplicate: 'Index keys must be unique',
  blank: 'You must select a field name and type'
};
/**
 * The reflux store for storing the form for creating indexes.
 */
const CreateIndexStore = Reflux.createStore({

  /**
   * Initialize the index fields store.
   */
  init: function() {
    this.listenTo(Action.clearForm, this.clearForm);
    this.listenTo(Action.triggerIndexCreation, this.triggerIndexCreation);
    this.listenTo(Action.updateOption, this.updateOption);
    this.listenTo(Action.addIndexField, this.addIndexField);
    this.listenTo(Action.updateFieldName, this.updateFieldName);
    this.listenTo(Action.updateFieldType, this.updateFieldType);
    this.listenTo(Action.removeIndexField, this.removeIndexField);
    this.schemaFields = []; // fields in the current schema
    this.fields = [{name: '', type: ''}];
    this.options = {}; // options for new index
  },

  onActivated(appRegistry) {
    appRegistry.getStore('Field.Store').listen(this.onFieldChanged.bind(this));
  },

  /*
   * Reset fields and options and send both to listeners.
   */
  clearForm: function() {
    this.fields = [{name: '', type: ''}];
    this.options = {};
    this.sendValues();
  },

  /*
   * Transform the data to fit Data Service specifications and trigger index creation.
   */
  triggerIndexCreation: function() {
    const spec = {};

    // check for errors
    if (this.fields.some(field => (field.name === '' || field.type === ''))) {
      Action.updateStatus('error', ERRORS.blank);
      return;
    }

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
    const nsStore = app.appRegistry.getStore('App.NamespaceStore');
    Action.createIndex(nsStore.ns, spec, options);
  },

  /**
   * Parse and load fields from the field store.
   *
   * @param {Object} state - The state of the field store.
   */
  onFieldChanged: function(state) {
    if (!state.fields) {
      return;
    }

    // don't allow users to make indexes on _id
    this.schemaFields = Object.keys(state.fields).filter(name => name !== '_id');
    this.sendValues();
  },

  /**
   * Send fields, options, and schema fields to listeners.
   */
  sendValues: function() {
    this.trigger(this.fields, this.options, this.schemaFields);
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
  },

  addIndexField: function() {
    this.fields.push({name: '', type: ''});
    this.sendValues();
  },

  updateFieldName: function(idx, name) {
    if (idx >= 0 && idx < this.fields.length) {
      // check if field name already exists or no
      if (this.fields.some(field => field.name === name)) {
        Action.updateStatus('error', ERRORS.duplicate);
      } else {
        this.fields[idx].name = name;
      }
      // check if field name exists in schemaFields, otherwise add
      if (!_.contains(this.schemaFields, name)) {
        this.schemaFields.push(name);
      }
    }
    this.sendValues();
  },

  updateFieldType: function(idx, type) {
    if (idx >= 0 && idx < this.fields.length) {
      this.fields[idx].type = type;
    }
    this.sendValues();
  },

  removeIndexField: function(idx) {
    if (idx >= 0 && idx < this.fields.length) {
      this.fields.splice(idx, 1);
    }
    this.sendValues();
  }
});


module.exports = CreateIndexStore;
