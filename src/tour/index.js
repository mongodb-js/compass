var $ = require('jquery');
var View = require('ampersand-view');

var TourView = View.extend({
  props: {
    isAnimating: {
      type: 'boolean',
      default: true
    },
    tourCount: {
      type: 'number',
      default: 0
    },
    tourImages: {
      type: 'array',
      default: function() {
        return [
          { file: 'f1.gif', duration: 4000 },
          { file: 'f2.gif', duration: 9000 },
          { file: 'f3.gif', duration: 9000 },
          { file: 'f4.gif', duration: 6000 },
          { file: 'f5.gif', duration: 9000 }
        ];
      }
    },
    tourImagesFolder: {
      type: 'string',
      default: './images/tour/'
    }
  },
  template: require('./index.jade'),
  events: {
    'click #features ul': 'showFeature',
    'click #tour-remove': 'tourRemove',
    'click #tour-bg': 'tourRemove'
  },
  render: function() {
    var that = this;
    this.renderWithTemplate(this);
    this.$featuresUL = this.query('#features ul');
    this.$featuresLI = this.queryAll('#features li');
    this.$animationGIF = this.query('#animation-gif');
    this.$tourRemove = this.query('#tour-remove');
    function showAnimation() {
      var duration = that.tourImages[that.tourCount].duration;
      // deselect old
      $('#features li.selected').removeClass('selected');
      // select new
      that.$featuresLI[that.tourCount].className = 'selected';
      that.$animationGIF.src = that.tourImagesFolder + that.tourImages[that.tourCount].file;
      if (that.tourCount === 4) {
        that.tourCount = 0;
      } else {
        that.tourCount++;
      }
      if (that.isAnimating) {
        setTimeout(showAnimation, duration);
      }
    }
    showAnimation();
  },
  showFeature: function(ev) {
    this.isAnimating = false;
    var nCLick = ev.target.getAttribute('data-n');
    if (nCLick === null) {
      return false;
    }
    var nFeature = parseInt(nCLick, 10);
    // deselect old
    $('#features li.selected').removeClass('selected');
    // select new
    ev.target.className = 'selected';
    this.$animationGIF.src = this.tourImagesFolder + ev.target.id + '.gif';
    this.tourCount = nFeature;
  },
  tourRemove: function() {
    this.isAnimating = false;
    this.remove();
  }
});

module.exports = TourView;
