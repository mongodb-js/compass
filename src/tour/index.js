var $ = require('jquery');
var View = require('ampersand-view');

var TourView = View.extend({
  props: {
    tourCount: { type: 'number', default: 0 },
    tourImages: { type: 'array', default: function() { 
      return ['f1.gif', 'f2.gif', 'f3.gif', 'f4.gif', 'f5.gif'] 
    }
    },
    tourImagesFolder: { type: 'string', default: './images/tour/' }
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

    this.$featuresUL = this.query ('#features ul');
    this.$featuresLI = this.queryAll ('#features li');
    this.$animationGIF = this.query ('#animation-gif');
    this.$tourRemove = this.query ('#tour-remove');

    this.playAuto = setInterval(function() {
      that.$featuresLI[that.tourCount].className = '';

      if (that.tourCount == 4) {
        that.tourCount = 0;
      } else {
        that.tourCount++;
      }
      that.$featuresLI[that.tourCount].className = 'selected';
      that.$animationGIF.src = that.tourImagesFolder + that.tourImages [that.tourCount];      
    }, 1000 * 7);
  },

  showFeature: function(ev) {
    var nCLick = ev.target.getAttribute ('data-n');
    if (nCLick == null) {
      return false;
    }
    var nFeature = parseInt(nCLick, 10);
    this.$featuresLI[this.tourCount].className = '';
    ev.target.className = 'selected';
    this.$animationGIF.src = this.tourImagesFolder + ev.target.id + '.gif';    
    this.tourCount = nFeature;
    clearInterval(this.playAuto);
  },
  tourRemove: function() {
    clearInterval(this.playAuto);    
    this.remove ();
  }
});

module.exports = TourView;
