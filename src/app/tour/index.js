var $ = require('jquery');
var View = require('ampersand-view');
var app = require('hadron-app');
var semver = require('semver');
var _ = require('lodash');
var path = require('path');
var electronApp = require('electron').remote.app;

var indexTemplate = require('./index.jade');

// var debug = require('debug')('mongodb-compass:tour:index');

var ESC_KEY = 27;
var LEFT_ARROW_KEY = 37;
var RIGHT_ARROW_KEY = 39;
var TAB_KEY = 9;
var ENTER_KEY = 13;
var SPACE_KEY = 32;

/**
 * The feature tour highlights some signature features of MongoDB Compass.
 * When Compass is started for the first time, it shows all the features in
 * below list that have the `initial` value set to true. This allows us to
 * highlight the top x (5?) features, especially when we add more features
 * over time.
 * The initial tour has a title of "Welcome to MongoDB Compass".
 *
 * When Compass has been run before and detects a version change, it will only
 * show the features that are newer than the previously ran version, and the
 * title will instead say: "What's New in MongoDB Compass". Now all features
 * since the last version are presented, the `initial` value is ignored.
 *
 * To add new features to the tour, simply add another object to the FEATURES
 * array below, and make sure the right version is set. This class will do
 * the rest.
 *
 * @type {Array}
 */
var FEATURES = require('./features');

var TourView = View.extend({
  session: {
    body: 'any',
    features: {
      type: 'array',
      required: false,
      default: undefined
    },
    force: {
      type: 'boolean',
      default: false
    },
    tourCount: {
      type: 'number',
      default: 0
    },
    tourImagesFolder: {
      type: 'string',
      default: './images/tour/'
    },
    timeAtStart: {
      type: 'date'
    }
  },
  template: indexTemplate,
  derived: {
    previousVersion: {
      deps: ['app.preferences.showFeatureTour'],
      fn: function() {
        return app.preferences.showFeatureTour || '0.0.0';
      }
    },
    title: {
      deps: ['previousVersion'],
      fn: function() {
        return (this.previousVersion === '0.0.0' || process.env.NODE_ENV === 'testing') ?
          `Welcome to ${electronApp.getName()}` : `What\'s New in ${electronApp.getName()}`;
      }
    }
  },
  events: {
    'click .pager ul': 'showFeature',
    'click .previous-slide': 'showPreviousFeature',
    'click .next-slide': 'showNextFeature',
    'click #tour-remove': 'tourRemove',
    'click .tour-close-button': 'tourRemove',
    'click #tour-bg': 'tourRemove'
  },
  bindings: {
    title: {
      hook: 'title'
    }
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
    this._getFeatures();
  },
  _getFeatures: function() {
    var model = this;
    if (_.isArray(model.features)) {
      return model.features;
    }

    /**
     * @see https://jira.mongodb.org/browse/INT-1657
     */
    var previous = model.previousVersion || '0.0.0';

    model.features = _.filter(FEATURES, function(feature) {
      if (model.force && feature.initial) {
        return true;
      }

      if (previous === '0.0.0' && feature.initial) {
        return true;
      }

      if (previous !== '0.0.0' && semver.gt(feature.version, previous)) {
        return true;
      }

      return false;
    });
    return model.features;
  },
  render: function() {
    this.renderWithTemplate(this);
    this.body = document.getElementsByTagName('body')[0];
    this.body.addEventListener('keydown', this.onKeyPress);
    this.$featuresUL = this.query('#features ul');
    this.$featuresLI = this.queryAll('#features li');
    this.$animationGIF = this.query('#animation-gif');
    this.$tourRemove = this.query('#tour-remove');
    this.timeAtStart = new Date();
    _.defer(this.showHidePreviousNextButtons.bind(this));
  },
  showHidePreviousNextButtons: function() {
    if (this.tourCount === 0) {
      $('.previous-slide').addClass('hide');
    } else {
      $('.previous-slide').removeClass('hide');
    }

    if (this.tourCount === this.features.length - 1) {
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
    $('.pager li.selected').removeClass('selected');
    $('.feature-content.active').removeClass('active');

    // select new
    ev.target.className = 'selected';

    $('#animation-gif').one('webkitTransitionEnd', function() {
      that.$animationGIF.src = path.join(that.tourImagesFolder, that.features[nFeature].image);
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
    $('.pager li.selected').removeClass('selected');
    $('.feature-content.active').removeClass('active');

    // select new
    $('.pager li#f' + previousFeature).addClass('selected');

    $('#animation-gif').one('webkitTransitionEnd', function() {
      that.$animationGIF.src = path.join(that.tourImagesFolder, that.features[previousFeature].image);
      $('#animation-gif').css('opacity', '1');
    });
    $('#animation-gif').css('opacity', '0');
    $('.feature-content#f' + previousFeature + '-content').addClass('active');

    this.tourCount = previousFeature;
    this.showHidePreviousNextButtons();
  },
  showNextFeature: function() {
    if (this.tourCount >= this.features.length - 1) {
      return;
    }
    var nextFeature = this.tourCount + 1;
    var that = this;

    // deselect old
    $('.pager li.selected').removeClass('selected');
    $('.feature-content.active').removeClass('active');

    // select new
    $('.pager li#f' + nextFeature).addClass('selected');

    $('#animation-gif').one('webkitTransitionEnd', function() {
      that.$animationGIF.src = path.join(that.tourImagesFolder, that.features[nextFeature].image);
      $('#animation-gif').css('opacity', '1');
    });
    $('#animation-gif').css('opacity', '0');
    $('.feature-content#f' + nextFeature + '-content').addClass('active');

    this.tourCount = nextFeature;
    this.showHidePreviousNextButtons();
  },
  tourRemove: function() {
    const feature = this.features[this.tourCount];
    global.hadronApp.appRegistry.emit('tour-closed', feature.title);
    this.trigger('close');
    this.body.removeEventListener('keydown', this.onKeyPress);
    this.remove();
  }
});

module.exports = TourView;
