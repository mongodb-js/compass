/**
 * Choose a random ephemeral port to serve our (perhaps many) SSH Tunnels.
 * IANA says 29170-29998 is unassigned,
 * but Nintendo used 29900+ according to Wikipedia.
 * https://en.wikipedia.org/wiki/Ephemeral_port
 * https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
 * http://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml?&page=127
 *
 * @returns {Number} Random port
 */
module.exports = () => {
  const startPort = 29170;
  const endPort = 29899;
  const randomPort = (
    Math.random() * (endPort - startPort + 1) +
    startPort
  ).toString();

  return parseInt(randomPort, 10);
};
