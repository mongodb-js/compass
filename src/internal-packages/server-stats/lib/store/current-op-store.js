const Reflux = require('reflux');
const app = require('ampersand-app');
const Actions = require('../action');
const toNS = require('mongodb-ns');
const debug = require('debug')('mongodb-compass:server-stats:crp-store');
const _ = require('lodash');

/* eslint complexity:0 */

/**
 * This store listens to the
 * 'pollCurrentOp' action, fetches the current op data, and
 * triggers with the result of the command.
 */
const CurrentOpStore = Reflux.createStore({

  /**
   * Initializing the store should set up the listener for
   * the 'pollCurrentOp' command.
   */
  init: function() {
    this.restart();
    this.listenTo(Actions.pollCurrentOp, this.currentOp);
    this.listenTo(Actions.pause, this.pause);
    this.listenTo(Actions.restart, this.restart);
    this.listenTo(Actions.startIndexBuild, this.startIndexBuild);
    this.listenTo(Actions.stopIndexBuild, this.stopIndexBuild);

    this.hasIndex = false;
    this.indexBuild = {
      'desc': 'conn772',
      'threadId': '0x700000c46000',
      'connectionId': 772,
      'client': '127.0.0.1:51631',
      'active': true,
      'opid': 192596,
      'secs_running': 1,
      'ms_running': 1000,
      'op': 'command',
      'ns': 'londonbikes.$cmd',
      'query': {
        'createIndexes': 'rides_pickup',
        'indexes': [
          {
            'key': {
              'startstation_gps': '2dsphere'
            },
            'name': 'startstation_gps_2dsphere'
          }
        ]
      },
      'msg': 'Index Build Index Build: 2688656/9224522 29%',
      'progress': {
        'done': 2688656,
        'total': 9224522
      },
      'numYields': 0,
      'locks': {
        'Global': 'w',
        'Database': 'W',
        'Collection': 'w'
      },
      'waitingForLock': false,
      'lockStats': {
        'Global': {
          'acquireCount': {
            'r': 1,
            'w': 1
          }
        },
        'Database': {
          'acquireCount': {
            'W': 1
          }
        },
        'Collection': {
          'acquireCount': {
            'w': 1
          }
        }
      }
    };
  },

  startIndexBuild() {
    this.hasIndex = true;
  },

  stopIndexBuild() {
    this.hasIndex = false;
  },

  restart: function() {
    this.allOps = [];
    this.isPaused = false;
    this.endPause = 0;
    this.overlayIndex = 0;
    this.inOverlay = false;
    this.xLength = 60;
    this.starting = true;
    this.error = null;
  },

  pause: function() {
    this.endPause = this.allOps.length;
    this.isPaused = !this.isPaused;
  },

  mouseOver: function(index) {
    const startPause = Math.max(this.endPause - this.xLength, 0);
    const visOps = this.allOps.slice(startPause, this.endPause);
    if (index >= visOps.length) {
      index = visOps.length - 1;
    }
    this.overlayIndex = index;
    this.inOverlay = true;
    if (this.allOps === undefined || this.allOps.length == 0) {
      return;
    }
    this.trigger(null, visOps[this.overlayIndex]);
  },

  mouseOut: function() {
    this.inOverlay = false;
    if (this.allOps === undefined || this.allOps.length == 0) {
      return;
    }
    const startPause = Math.max(this.endPause - this.xLength, 0);
    const visOps = this.allOps.slice(startPause, this.endPause);
    this.trigger(this.error, visOps[visOps.length - 1]);
  },

  currentOp: function() {
    if (!this.hasIndex) {
      this.trigger(null, []);
      return;
    }
    const doc = this.indexBuild;
    let totals = [];
    this.error = null;
    if (this.starting) { // Skip first to match charts
      this.starting = false;
      return;
    }
    doc.ms_running = doc.ms_running + 1000;
    doc.secs_running = doc.secs_running + 1;
    doc.active = doc.active.toString();
    doc.waitingForLock = doc.waitingForLock.toString();
    totals.push(doc);
    // Add current state to all
    this.allOps.push(totals);
    if (this.isPaused) {
      totals = this.allOps[this.endPause];
    } else {
      this.endPause = this.allOps.length;
    }
    // This handled by mouseover function completely
    if (this.inOverlay) {
      return;
    }
    this.trigger(null, totals);
  }
});

module.exports = CurrentOpStore;
