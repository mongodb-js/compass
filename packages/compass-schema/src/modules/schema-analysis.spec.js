import createSchemaAnalysis from './schema-analysis';

describe('schema-analyis', () => {
  describe('getResult', () => {
    it('returns the schema', async() => {
      const dataService = {
        sample: () => ({
          toArray: () => Promise.resolve([{x: 1}, {y: 2}])
        })
      };

      const schemaAnalysis = createSchemaAnalysis(
        dataService, 'db.coll', {}, {}
      );

      const schema = await schemaAnalysis.getResult();

      const expectedSchema = {
        'fields': [
          {
            'name': 'x', 'path': 'x', 'count': 1,
            'types': [{'name': 'Number', 'bsonType': 'Number', 'path': 'x', 'count': 1, 'values': [1], 'total_count': 0, 'probability': 0.5, 'unique': 1, 'has_duplicates': false}, {'name': 'Undefined', 'type': 'Undefined', 'path': 'x', 'count': 1, 'total_count': 0, 'probability': 0.5, 'unique': 1, 'has_duplicates': false}],
            'total_count': 2, 'type': ['Number', 'Undefined'],
            'has_duplicates': false, 'probability': 0.5
          },
          {
            'name': 'y', 'path': 'y', 'count': 1,
            'types': [{'name': 'Number', 'bsonType': 'Number', 'path': 'y', 'count': 1, 'values': [2], 'total_count': 0, 'probability': 0.5, 'unique': 1, 'has_duplicates': false}, {'name': 'Undefined', 'type': 'Undefined', 'path': 'y', 'count': 1, 'total_count': 0, 'probability': 0.5, 'unique': 1, 'has_duplicates': false}],
            'total_count': 2,
            'type': ['Number', 'Undefined'],
            'has_duplicates': false, 'probability': 0.5
          }
        ],
        'count': 2
      };

      expect(schema).to.deep.equal(expectedSchema);
    });

    it('returns null if is cancelled', async() => {
      let rejectOnSample;
      const dataService = {
        sample: () => ({
          toArray: () => new Promise((_, _reject) => {
            rejectOnSample = _reject;
          })
        })
      };

      const schemaAnalysis = createSchemaAnalysis(
        dataService, 'db.coll', {}, {}
      );

      const getResultPromise = schemaAnalysis.getResult();

      rejectOnSample(new Error('should have been cancelled'));
      schemaAnalysis.terminate();

      expect(await getResultPromise).to.equal(null);
    });

    it('throws if sample throws', async() => {
      let rejectOnSample;
      const dataService = {
        sample: () => ({
          toArray: () => new Promise((_, _reject) => {
            rejectOnSample = _reject;
          })
        })
      };

      const schemaAnalysis = createSchemaAnalysis(
        dataService, 'db.coll', {}, {}
      );

      const getResultPromise = schemaAnalysis.getResult().catch(err => err);

      rejectOnSample(new Error('should have been thrown'));

      expect((await getResultPromise).message).to.equal('should have been thrown');
    });
  });
});


