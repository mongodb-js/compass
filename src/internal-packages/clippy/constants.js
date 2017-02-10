const s = '\u2006\u200B';
const space = s + s + s + s + s + s + s + s + s + s + s;

const clippings = Object.freeze({
  /**
   * Query messages
   */
  'space': space,

  'Query': {
    'bad': {
      'message': [
        'Ok seriously what are you doing?, use oid',
        'Please stop, go back and use oid',
        'I\'m really upset :(',
        'Please no more!'
      ],
      'animation': [
        'Acknowledge',
        'Save',
        'GetTechy',
        'GestureUp'
      ],
      'move': {
        'location': [250, 150],
        'message': 'try changing the query',
        'animation': 'GestureUp'
      }
    }
  },

  'Explain': {
    'bad': {
      'message': [
        'No index. Bad DBA.' + space,
        'Your query is not indexed so you should feel bad.' + space
      ],
      'slow': [
        'This query is so slow. Perhaps an index is needed?' + space
      ],
      'notPrefix': [
        'Although the query is defined in an index, it is not a prefix of any index. Would you like to know more? Please send 1 bitcoin.' + space
      ],
      'move': {
        'location': [550, 100],
        'message': 'Try adding an index here',
        'animation': 'GestureUp'
      },
      'animation': []
    }
  },

  'Startup': {
    'bad': {
      'auth': [
        'I see that you have no auth. Do you want to get hacked? Because this is how you get hacked.' + space,
        'Without auth, this will be an ex-database soon' + space
      ],
      'outdated': [
        'This version is horribly outdated. Do you have no internet?' + space,
        'Welcome to the world of outdated MongoDB. I will be your guide.' + space
      ],
      'hax0red': [
        'It looks like you have an offsite backup set up. Please send 1 BTC to restore. Don\'t forget to turn on auth afterward.' + space
      ],
      'animation': []
    }
  }
});

module.exports = clippings;

/**
 clippy actions!
[
  "DeepIdle1",
  "Congratulate",
  "Idle(1)",
  "Hide",
  "SendMail",
  "Thinking",
  "Idle(3)",
  "Explain",
  "Idle(5)",
  "Print",
  "LookRight",
  "GetAttention",
  "Save",
  "GetTechy",
  "GestureUp",
  "Idle1_1",
  "Processing",
  "Alert",
  "LookUpRight",
  "Idle(9)",
  "Idle(7)",
  "GestureDown",
  "LookLeft",
  "Idle(2)",
  "LookUpLeft",
  "CheckingSomething",
  "Hearing_1",
  "GetWizardy",
  "GestureLeft",
  "Wave",
  "Goodbye",
  "GestureRight",
  "Writing",
  "LookDownRight",
  "GetArtsy",
  "Show",
  "LookDown",
  "Searching",
  "Idle(4)",
  "EmptyTrash",
  "Greeting",
  "LookUp",
  "Idle(6)",
  "RestPose",
  "Idle(8)",
  "LookDownLeft"
]
**/
