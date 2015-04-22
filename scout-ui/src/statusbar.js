var AmpersandView = require('ampersand-view');
var $ = require('jquery');

var StatusbarView = AmpersandView.extend({
  props: {
    width: {
      type: 'number',
      default: 0
    }
  },
  bindings: {
    width: [
      {
        hook: 'bar',
        type: function (el, value, previousValue) {
          if(!this.el) return;
          if(value === 0){
            $(this.el).find('.progress').css({height: '0px'});
          }
          else {
            $(this.el).find('.progress-bar').css({width: value + '%'});
            $(this.el).find('.progress').css({height: '4px'});
          }
        }
      },
      {
        type: 'booleanClass',
        yes: 'visible',
        no: 'hidden'
      }
    ]
  },
  watch: function(view, collection){
    view.listenTo(collection, 'sync', this.hide.bind(this));
    view.listenTo(collection, 'request', this.show.bind(this));
    return this;
  },
  unwatch: function(view, collection){
    view.stopListening(collection, 'sync', this.hide.bind(this));
    view.stopListening(collection, 'request', this.show.bind(this));
    return this;
  },
  show: function(){
    this.$el = $('#statusbar');
    this.el = this.$el.get(0);
    this.width = 100;
  },
  hide: function(){
    this.width = 0;
  },
  render: function(){
    this.show();
  }
});

module.exports = StatusbarView;
