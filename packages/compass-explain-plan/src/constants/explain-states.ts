// Constants for explain state.
export default {
  INITIAL: 'initial', // A zero state that is being shown by default
  OUTDATED: 'outdated', // When new query was set and explain plan should be fetched again
  REQUESTED: 'requested', // When request for a query explain is dispatched
  EXECUTED: 'executed', // When new query was executed by explain plan
};
