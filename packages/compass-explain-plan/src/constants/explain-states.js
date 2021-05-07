// Constants for explain state.
module.exports = {
  INITIAL: 'initial', // A zero state that is being shown by default
  OUTDATED: 'outdated', // When new query was set and explain plan should be fetched again
  EXECUTED: 'executed', // When new query was executed by explain plan
};
