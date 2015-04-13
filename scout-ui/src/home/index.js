var AmpersandView = require('ampersand-view');
var AmpersandModel = require('ampersand-model');
var client = require('../../../scout-client');
var brain = require('../../../scout-brain');

client.configure({
  endpoint: 'localhost:29017',
  mongodb: 'localhost:27017'
});

var Mackbone = client.adapters.Backbone;

var Instance = AmpersandModel.extend(brain.models.Instance, Mackbone.Model, {
  url: '/instance'
});

module.exports = AmpersandView.extend({
  children: {
    model: Instance
  },
  initialize: function(){
    this.listenTo(this.model, 'sync', this._onModel);
    this.model.fetch();
  },
  _onModel: function(){
    console.log('_onModel', this);
  },
  template: require('./index.jade')
});
