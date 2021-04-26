
/**
 * Creates a new object to use as `metadata` for `Mongosh..Error`s.
 *
 * @param apiDetails Additional details on the blocked API
 */
function blockedByDriverMetadata(apiDetails: string) {
  return {
    driverCaused: true,
    api: apiDetails
  };
}

/**
 * @mongoshErrors
 */
enum ShellApiErrors {
  /**
   * Signals calling a method that requires sharding for a collection that is not sharded
   * or a database that does not have sharding enabled.
   *
   * **Solution: Be sure to enable sharding on the database or that the collection is sharded.**
   */
  NotConnectedToShardedCluster = 'SHAPI-10001',

  /**
   * Signals calling a method requiring a replica set without being connected to a replica set.
   *
   * **Solution: Make sure you are connected to a replica set.**
   */
  NotConnectedToReplicaSet = 'SHAPI-10002',

  /**
   * Signals calling a method that requires to be connected to a `mongos` instead of just a `mongod`.
   *
   * **Solution: Ensure you are connected to a `mongos` instances.**
   */
  NotConnectedToMongos = 'SHAPI-10003',

  /**
   * Signals calling an operation that requires an active database connection without being connected.
   *
   * **Solution: Connect to a database before executing the operation.**
   */
  NotConnected = 'SHAPI-10004',

  /**
   * Signals calling a method that requires a Mongo object with field-level encryption options
   * when none were passed.
   *
   * **Solution: Create a new Mongo object with the correct field-level encryption options first.**
   */
  NotUsingFLE = 'SHAPI-10005',
}

export {
  blockedByDriverMetadata,
  ShellApiErrors
};
