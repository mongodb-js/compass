const slowOperations = [
  { operationType: 'query', collectionName: 'location.citiesGeo', time: '412ms', color: 'rt--blue' },
  { operationType: 'update', collectionName: 'session.users', time: '397ms', color: 'rt--purple' },
  { operationType: 'insert', collectionName: 'users.albumsImages', time: '337ms', color: 'rt--green'},
  { operationType: 'query', collectionName: 'albums.geoPhone', time: '292ms', color: 'rt--purple' },
  { operationType: 'delete', collectionName: 'system.sessionUsers', time: '232ms', color: 'rt--red' },
  { operationType: 'query', collectionName: 'location.citiesGeo', time: '112ms', color: 'rt--yellow' }
];

module.exports = slowOperations;
