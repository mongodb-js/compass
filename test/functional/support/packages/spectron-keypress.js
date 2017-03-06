/**
 * Add commands to the client related to the pressing keys on a keyboard.
 *
 * @param {Client} client - The client.
 */
function addKeyPressCommands(client) {
  /**
   * Press escape
   */
  client.addCommand('pressEscape', function() {
    return this.keys(['Escape']);
  });

  /**
   * Press enter
   */
  client.addCommand('pressEnter', function() {
    return this.keys(['Enter']);
  });
}


module.exports = addKeyPressCommands;
