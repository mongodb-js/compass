var $ = require('jquery');
var View = require('ampersand-view');

var TourView = View.extend({
  props: {
    tourCount: {
      type: 'number',
      default: 0
    },
    tourImagesFolder: {
      type: 'string',
      default: './images/tour/'
    }
  },
  template: require('./index.jade'),
  events: {
    'click #features ul': 'showFeature',
    'click .previous-slide': 'showPreviousFeature',
    'click .next-slide': 'showNextFeature',
    'click #tour-remove': 'tourRemove',
    'click #tour-bg': 'tourRemove'
  },
  render: function() {
    this.renderWithTemplate(this);
    this.$featuresUL = this.query('#features ul');
    this.$featuresLI = this.queryAll('#features li');
    this.$animationGIF = this.query('#animation-gif');
    this.$tourRemove = this.query('#tour-remove');
  },
  showFeature: function(ev) {
    var nCLick = ev.target.getAttribute('data-n');
    if (nCLick === null) {
      return false;
    }
    var nFeature = parseInt(nCLick, 10);
    
    // deselect old
    $('#features li.selected').removeClass('selected');
    $('.feature-content.active').removeClass('active');
    
    // select new
    ev.target.className = 'selected';
    this.$animationGIF.src = this.tourImagesFolder + ev.target.id + '.gif';
    $('.feature-content#f' + nFeature + '-content').addClass('active');
    this.tourCount = nFeature;
  },
  showPreviousFeature: function(ev) {
    var currentFeature = this.tourCount;
    var previousFeature = this.tourCount - 1;
    
    // deselect old
    $('#features li.selected').removeClass('selected');
    $('.feature-content.active').removeClass('active');
    
    // select new
    $('#features li#f' + previousFeature).addClass('selected');
    this.$animationGIF.src = this.tourImagesFolder + 'f' + previousFeature + '.gif';
    $('.feature-content#f' + previousFeature + '-content').addClass('active');

    this.tourCount = previousFeature;
  },
  showNextFeature: function(ev) {
    var currentFeature = this.tourCount;
    var nextFeature = this.tourCount + 1;
    
    // deselect old
    $('#features li.selected').removeClass('selected');
    $('.feature-content.active').removeClass('active');
    
    // select new
    $('#features li#f' + nextFeature).addClass('selected');
    this.$animationGIF.src = this.tourImagesFolder + 'f' + nextFeature + '.gif';
    $('.feature-content#f' + nextFeature + '-content').addClass('active');

    this.tourCount = nextFeature;
  },
  tourRemove: function() {
    this.remove();
  }
});

module.exports = TourView;
