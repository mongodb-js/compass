import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { startTestServer } from '@mongodb-js/compass-test-server';
import type { MongoCluster } from '@mongodb-js/compass-test-server';
import { seedServer } from './seed-server';
import type { SeedDatabase } from '../../types/seed-data';

describe('seedServer', function () {
  this.timeout(120_000);

  let cluster: MongoCluster;
  let client: MongoClient;

  const testDatabases: SeedDatabase[] = [
    {
      databaseName: 'test_seed_db',
      collections: [
        {
          collectionName: 'items',
          documents: [
            { name: 'widget', price: 10 },
            { name: 'gadget', price: 25 },
            { name: 'doohickey', price: 5 },
          ],
          indexes: [{ key: { price: 1 } }],
        },
        {
          collectionName: 'users',
          documents: [
            { username: 'alice', active: true },
            { username: 'bob', active: false },
          ],
        },
      ],
    },
  ];

  before(async function () {
    cluster = await startTestServer();
    client = new MongoClient(cluster.connectionString);
    await client.connect();
    await seedServer(client, testDatabases);
  });

  after(async function () {
    await client?.close();
    await cluster?.close();
  });

  it('should insert all documents into each collection', async function () {
    const itemsCount = await client
      .db('test_seed_db')
      .collection('items')
      .countDocuments();
    expect(itemsCount).to.equal(3);

    const usersCount = await client
      .db('test_seed_db')
      .collection('users')
      .countDocuments();
    expect(usersCount).to.equal(2);
  });

  it('should create specified indexes', async function () {
    const indexes = await client
      .db('test_seed_db')
      .collection('items')
      .indexes();

    const indexKeys = indexes.map((idx) => idx.key);
    expect(indexKeys).to.deep.include({ price: 1 });
  });

  it('should not create indexes when none are specified', async function () {
    const indexes = await client
      .db('test_seed_db')
      .collection('users')
      .indexes();

    // Only the default _id index
    expect(indexes).to.have.lengthOf(1);
    expect(indexes[0].key).to.deep.equal({ _id: 1 });
  });

  it('should allow querying the seeded data', async function () {
    const cheap = await client
      .db('test_seed_db')
      .collection('items')
      .find({ price: { $lt: 15 } })
      .toArray();

    expect(cheap).to.have.lengthOf(2);
    const names = cheap.map((doc) => doc.name);
    expect(names).to.include('widget');
    expect(names).to.include('doohickey');
  });

  it('should have no in-progress index builds after seeding', async function () {
    const result = await client.db('admin').command({
      currentOp: true,
      $all: false,
      'command.createIndexes': { $exists: true },
    });

    expect(result.inprog).to.have.lengthOf(0);
  });

  it('should have fully built indexes that are usable', async function () {
    // Use explain to verify the price index is used for a query
    const explanation = await client
      .db('test_seed_db')
      .collection('items')
      .find({ price: { $gt: 10 } })
      .explain();

    // The winning plan should reference the price index, not a COLLSCAN
    const planStage =
      (explanation as any).queryPlanner?.winningPlan?.inputStage?.stage ??
      (explanation as any).queryPlanner?.winningPlan?.stage;
    expect(planStage).to.not.equal('COLLSCAN');
  });

  it('should complete indexes for a 2dsphere index', async function () {
    const geoDb: SeedDatabase[] = [
      {
        databaseName: 'test_geo_db',
        collections: [
          {
            collectionName: 'places',
            documents: [
              {
                name: 'Place A',
                location: { type: 'Point', coordinates: [0, 0] },
              },
              {
                name: 'Place B',
                location: { type: 'Point', coordinates: [1, 1] },
              },
            ],
            indexes: [{ key: { location: '2dsphere' } }],
          },
        ],
      },
    ];

    await seedServer(client, geoDb);

    const indexes = await client
      .db('test_geo_db')
      .collection('places')
      .indexes();

    const geoIndex = indexes.find((idx) =>
      Object.values(idx.key).includes('2dsphere')
    );
    expect(geoIndex).to.exist;

    // Verify the index is usable with a geo query
    const results = await client
      .db('test_geo_db')
      .collection('places')
      .find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [0, 0] },
            $maxDistance: 200000,
          },
        },
      })
      .toArray();

    expect(results.length).to.be.greaterThan(0);
    expect(results[0].name).to.equal('Place A');
  });
});
