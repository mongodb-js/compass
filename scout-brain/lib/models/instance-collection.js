var instance = require('./instance'),
  AmpersandCollection = require('ampersand-collection');

var InstanceCollection = AmpersandCollection.extend({
  model: function(attrs, opts){
    var t = this.parent.type;

    if(t === 'cluster'){
      if(attrs.type === 'config') return new instance.Config(attrs, opts);
      if(attrs.type === 'router') return new instance.Router(attrs, opts);
      return new instance.ClusteredStore(attrs, opts);
    }

    if(t === 'replicaset'){
      if(attrs.state === 'arbiter') return new instance.Arbiter(attrs, opts);
      return new instance.ReplicasetStore(attrs, opts);
    }

    return new instance.Store(attrs, opts);
  }
});

module.exports = InstanceCollection;
