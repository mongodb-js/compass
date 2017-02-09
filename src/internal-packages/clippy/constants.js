const clippings = Object.freeze({
  /**
   * Query messages
   */
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
      ]
    }
  },

  'Explain': {
    'bad': {
      'message': [
        'No index. Bad DBA.',
        'Your query is not indexed so you should feel bad.'
      ],
      'slow': [
        'This query is so slow. Perhaps an index is needed?'
      ],
      'notPrefix': [
        'Although the query is defined in an index, it is not a prefix of any index. Would you like to know more? Please send 1 bitcoin.'
      ],
      'animation': []
    }
  },

  'Startup': {
    'bad': {
      'auth': [
        'I see that you have no auth. Do you want to get hacked? Because this is how you get hacked.',
        'Without auth, this will be an ex-database soon'
      ],
      'outdated': [
        'This version is horribly outdated. Do you have no internet?',
        'Welcome to the world of outdated MongoDB. I will be your guide.'
      ],
      'hax0red': [
        'It looks like you have an offsite backup set up. Please send 1 BTC to restore. Don\'t forget to turn on auth afterward.'
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
