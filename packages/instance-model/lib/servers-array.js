module.exports = function serversArray(serversMap) {
  const servers = [];

  for (const desc of serversMap.values()) {
    servers.push({
      address: desc.address,
      type: desc.type,
      tags: desc.tags
    });
  }

  return servers;
};