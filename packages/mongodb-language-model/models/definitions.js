var definitions = module.exports = {
  treeOperators: ['$or', '$and', '$nor'],
  listOperators: ['$in', '$nin', '$elemMatch'],
  valueOperators: ['$gt', '$gte', '$lt', '$lte', '$exists', '$type', '$size', '$eq', '$ne', '$not'],
  geoOperators: ['$geoWithin'],
  geoWithinShapeOperators: ['$center', '$centerSphere', '$box', '$polygon', '$geometry']
};
