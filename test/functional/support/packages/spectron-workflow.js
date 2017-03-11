/**
 * Add commands to the client related to workflows and common tasks.
 *
 * @param {Client} client - The client.
 */
function addWorkflowCommands(client) {
  /**
   * Press escape
   */
  client.addCommand('connectToCompass', function(connection) {
    return this
      .inputConnectionDetails(connection)
      .clickConnectButton()
      .waitForStatusBar();
  });
}


module.exports = addWorkflowCommands;
