function addWaitHomeViewCommands(client) {
  /**
   * Wait for the home screen to finish loading.
   */
  client.addCommand('waitForHomeView', function(nextTitle) {
    return this.waitUntilInCompass(() => {
      return client.getTitle().then((title) => {
        return title === nextTitle;
      });
    });
  });
}


/**
 * Add commands to the client related to the Home View.
 *
 * @param {Client} client - The client.
 */
function addHomeViewCommands(client) {
  addWaitHomeViewCommands(client);
}


module.exports = addHomeViewCommands;
