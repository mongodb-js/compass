var View = require('ampersand-view');
var app = require('ampersand-app');
var ConnectionCollection = require('../models/connection-collection');
var Connection = require('../models/connection');
var format = require('util').format;
var $ = require('jquery');

var ConnectionView = View.extend({
  props: {
    model: Connection
  },
  events: {
    click: 'onClick',
    dblclick: 'onDoubleClick'
  },
  bindings: {
    'model.name': {
      hook: 'name'
    }
  },
  template: '<li class="list-group-item"><a data-hook="name"></a></li>',
  onClick: function(event) {
    event.stopPropagation();
    event.preventDefault();

    $('[name=hostname]').val(this.model.hostname);
    $('[name=port]').val(this.model.port);
    $('[name=name]').val(this.model.name);
  },
  onDoubleClick: function(event) {
    this.onClick(event);
    this.parent.parent.onSubmit(event);
  }
});

var SidebarView = View.extend({
  template: require('./sidebar.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, ConnectionView, this.queryByHook('connection-list'));
  }
});

/**
 * @todo (imlucas) Use ampersand-form-view.
 */
var ConnectView = View.extend({
  collections: {
    connections: ConnectionCollection
  },
  props: {
    message: {
      type: 'string',
      default: ''
    },
    has_error: {
      type: 'boolean',
      default: false
    }
  },
  bindings: {
    has_error: {
      hook: 'message',
      type: 'booleanClass',
      yes: 'alert-danger'
    },
    message: [
      {
        hook: 'message',
        type: 'booleanClass',
        no: 'hidden'
      },
      {
        hook: 'message'
      }
    ]
  },
  events: {
    'submit form': 'onSubmit'
  },
  initialize: function() {
    this.connections.fetch();
  },
  onSubmit: function(event) {
    event.stopPropagation();
    event.preventDefault();
    app.statusbar.show();
    this.message = format('Testing connection...');
    this.has_error = false;

    var hostname = $(this.el).find('[name=hostname]').val() || 'localhost';
    var port = parseInt($(this.el).find('[name=port]').val() || 27017, 10);
    var name = $(this.el).find('[name=name]').val() || 'Local';
    var uri = format('mongodb://%s:%d', hostname, port);

    var model = new Connection({
      name: name,
      hostname: hostname,
      port: port
    });
    model.test(function(err) {
      app.statusbar.hide();
      if (err) {
        this.has_error = true;
        this.message = format('Could not connect to %s', model.uri);
      } else {
        model.save();
        this.connections.add(model);
        this.message = 'Connected!';

        setTimeout(function() {
          this.message = '';
        }.bind(this), 500);

        window.open(format('%s?uri=%s#schema', window.location.origin, uri));
        setTimeout(function() {
          window.close();
        }, 1000);
      }
    }.bind(this));
  },
  template: require('./index.jade'),
  subviews: {
    sidebar: {
      waitFor: 'connections',
      hook: 'sidebar-subview',
      prepareView: function(el) {
        return new SidebarView({
          el: el,
          parent: this,
          collection: this.connections
        });
      }
    }
  }
});
module.exports = ConnectView;
