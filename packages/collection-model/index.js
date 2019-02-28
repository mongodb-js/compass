var CollectionModel = require('./lib/collection-model');
var CollectionModelCollection = require('./lib/collection-model').Collection;
var ExtendedCollectionModel = require('./lib/extended-collection-model');
var ExtendedCollectionModelCollection = require('./lib/extended-collection-model').Collection;

module.export = CollectionModel;
module.export.Collection = CollectionModelCollection;
/* Models used by Compass */
module.export.ExtendedCollectionModel = ExtendedCollectionModel;
module.export.ExtendedCollectionModel.Collection = ExtendedCollectionModelCollection;
