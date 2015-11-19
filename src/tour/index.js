var $ = require('jquery');
var View = require('ampersand-view');
// var debug = require('debug')('scout:tour:index');

var ESC_KEY = 27;
var LEFT_ARROW_KEY = 37;
var RIGHT_ARROW_KEY = 39;
var TAB_KEY = 9;
var ENTER_KEY = 13;
var SPACE_KEY = 32;

var TourView = View.extend({
  session: {
    body: 'any',
    numFeatures: {
      type: 'number',
      default: 5
    },
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
    'click .tour-close-button': 'tourRemove',
    'click #tour-bg': 'tourRemove'
  },
  onKeyPress: function(evt) {
    if (evt.keyCode === ESC_KEY) {
      evt.preventDefault();
      evt.stopPropagation();
      this.tourRemove();
    } else if ([RIGHT_ARROW_KEY, TAB_KEY, ENTER_KEY, SPACE_KEY].indexOf(evt.keyCode) !== -1) {
      this.showNextFeature();
    } else if (evt.keyCode === LEFT_ARROW_KEY) {
      this.showPreviousFeature();
    }
  },
  initialize: function() {
    this.onKeyPress = this.onKeyPress.bind(this);
    this.body = document.getElementsByTagName('body')[0];
    this.body.addEventListener('keydown', this.onKeyPress);
  },
  render: function() {
    this.renderWithTemplate(this);
    this.$featuresUL = this.query('#features ul');
    this.$featuresLI = this.queryAll('#features li');
    this.$animationGIF = this.query('#animation-gif');
    this.$tourRemove = this.query('#tour-remove');
  },
  showHidePreviousNextButtons: function() {
    if (this.tourCount === 0) {
      $('.previous-slide').addClass('hide');
    } else {
      $('.previous-slide').removeClass('hide');
    }

    if (this.tourCount === 4) {
      $('.next-slide').addClass('hide');
      $('#tour-remove').removeClass('hide');
    } else {
      $('.next-slide').removeClass('hide');
      $('#tour-remove').addClass('hide');
    }
  },
  showFeature: function(ev) {
    var nCLick = ev.target.getAttribute('data-n');
    var that = this;

    if (nCLick === null) {
      return false;
    }
    var nFeature = parseInt(nCLick, 10);

    // deselect old
    $('#features li.selected').removeClass('selected');
    $('.feature-content.active').removeClass('active');

    // select new
    ev.target.className = 'selected';

    $('#animation-gif').one('webkitTransitionEnd', function() {
      that.$animationGIF.src = that.tourImagesFolder + ev.target.id + '.gif';
      $('#animation-gif').css('opacity', '1');
    });
    $('#animation-gif').css('opacity', '0');

    $('.feature-content#f' + nFeature + '-content').addClass('active');

    this.tourCount = nFeature;
    this.showHidePreviousNextButtons();
  },
  showPreviousFeature: function() {
    if (this.tourCount <= 0) {
      return;
    }
    var previousFeature = this.tourCount - 1;
    var that = this;

    // deselect old
    $('#features li.selected').removeClass('selected');
    $('.feature-content.active').removeClass('active');

    // select new
    $('#features li#f' + previousFeature).addClass('selected');

    $('#animation-gif').one('webkitTransitionEnd', function() {
      that.$animationGIF.src = that.tourImagesFolder + 'f' + previousFeature + '.gif';
      $('#animation-gif').css('opacity', '1');
    });
    $('#animation-gif').css('opacity', '0');

    $('.feature-content#f' + previousFeature + '-content').addClass('active');

    this.tourCount = previousFeature;
    this.showHidePreviousNextButtons();
  },
  showNextFeature: function() {
    if (this.tourCount >= this.numFeatures - 1) {
      return;
    }
    var nextFeature = this.tourCount + 1;
    var that = this;

    // deselect old
    $('#features li.selected').removeClass('selected');
    $('.feature-content.active').removeClass('active');

    // select new
    $('#features li#f' + nextFeature).addClass('selected');

    $('#animation-gif').one('webkitTransitionEnd', function() {
      that.$animationGIF.src = that.tourImagesFolder + 'f' + nextFeature + '.gif';
      $('#animation-gif').css('opacity', '1');
    });
    $('#animation-gif').css('opacity', '0');

    $('.feature-content#f' + nextFeature + '-content').addClass('active');

    this.tourCount = nextFeature;
    this.showHidePreviousNextButtons();
  },
  tourRemove: function() {
    this.body.removeEventListener('keydown', this.onKeyPress);
    this.remove();
  }
});

module.exports = TourView;
