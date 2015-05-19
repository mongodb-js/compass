var hostname = require('os').hostname();

function urlBasedId(id) {
  if (typeof id === 'number') {
    id = 'localhost:' + id;
  }
  if (typeof id !== 'string') {
    throw TypeError;
  }
  return id.toLowerCase().replace(hostname, 'localhost').replace('mongodb://', '');
}

module.exports = {
  url: require('mongodb-url'),
  ns: require('mongodb-ns'),
  deployment_id: urlBasedId,
  instance_id: urlBasedId
};
