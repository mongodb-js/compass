// appease the jshint gods
var mongoscope = window.mongoscopeClient, Backbone = window.Backbone, _ = window._, $ = window.$;

// mongoscope is running in demo mode at http://scope.mongodb.land
// and has a standalone deployment running on it.
// One instance could potentially be part of a much larger deployment
// from which mongoscope will automatically discover all members.
mongoscope.configure({
  endpoint: 'http://scope.mongodb.land',
  mongodb: 'localhost:27017'
});

// Extend Backbone's default Model and Collection to use mongoscope
// client calls as the data provider for reads.
var Mackbone = mongoscope.adapters.Backbone;
var Collection = Backbone.Collection.extend(Mackbone.Collection);
var Model = Backbone.Model.extend(Mackbone.Model);

// For consuming real-time data via socket.io, extend ReadableStream.
var CollectionStream = Collection.extend(Mackbone.ReadableStream);

// A model for getting details about a mongodb instance, eg hostInfo,
// serverInfo, listDatabases, etc.
var Instance = Model.extend({url: '/instance'});

// Even better, let's make a collection that will tail the log
// of our instance and stream us back structured log lines
// thanks to [mongodb-log](http://github.com/imlucas/mongodb-log).
var LogStream = CollectionStream.extend({
  url: '/log', model: Model.extend({})
});

// Now that we have a model and collection, let's make a View to utilize them.
// Let's say you want to display a tail of the log and some diagnostics
// about the instance.
var InstanceLogView = Backbone.View.extend({
  // The underscore.js template for our page.
  tpl: _.template($('#instance-tpl').html()),
  initialize: function(){
    this.logs = new LogStream();

    // Get instance details and call `onInstanceInfo` to render them.
    this.instance = new Instance().on('sync', this.onInstanceInfo, this);
    this.instance.fetch();
  },
  // We got back the instance info so let's render that with our template.
  onInstanceInfo: function(){
    this.$el.html(this.tpl({
      instance: this.instance.toJSON(),
      logs: this.logs.toJSON()
    }));

    // Now that we have a div to render log lines into,
    // listen for log updates and call `onLogData` to render them.
    this.logs.on('sync', this.onLogData, this);
    this.logs.subscribe();
  },
  // Add new log messages to the bottom of the div with
  // the `log-lines` class.
  onLogData: function(collection, freshLogs){
    this.$el.find('.log-lines').append(freshLogs.map(function(line){
      return line.message;
    }).join('<br />'));
  }
});

// Now we just instantiate the view and you're tailing the logs.
new InstanceLogView({el: '.instance-logs'});
