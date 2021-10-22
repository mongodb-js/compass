import { expect } from 'chai';
import _ from 'lodash';
import { Db, MongoClient } from 'mongodb';
import { ConnectionOptions } from './connection-options';
import DataService from './data-service';
import { getInstance } from './instance-detail-helper';
import { Instance } from './types';

const connectionOptions: ConnectionOptions = Object.freeze({
  connectionString: 'mongodb://127.0.0.1:27018/data-service',
});

describe('instance-detail-helper', function () {
  describe('local', function () {
    let client: MongoClient;
    let db: Db;
    after(function (done) {
      client.close(true, done);
    });

    it('should connect to `localhost:27018`', async function () {
      client = await MongoClient.connect(
        'mongodb://localhost:27018/data-service?directConnection=true'
      );
      db = client.db('data-service');
    });

    it('should not close the db after getting instance details', function (done) {
      getInstance(client)
        .then(() => {
          db.admin().ping(function (err) {
            if (err) {
              done(err);
              return;
            }
            done();
          });
        })
        .catch(done);
    });

    describe('views', function () {
      let dataService: DataService;
      let mongoClient: MongoClient;
      let instanceDetails: Instance;

      before(async function () {
        if (process.env.MONGODB_TOPOLOGY === 'cluster') {
          return this.skip();
        }

        dataService = new DataService(connectionOptions);
        await dataService.connect();
        mongoClient = await MongoClient.connect(
          connectionOptions.connectionString
        );

        await mongoClient
          .db()
          .collection('test-instance-detail-helper')
          .insertMany([
            {
              1: 'a',
              a: 1,
            },
            {
              2: 'a',
              a: 2,
            },
          ]);
      });

      after(async function () {
        await dataService.disconnect().catch(console.log);
        try {
          await mongoClient
            .db()
            .collection('test-instance-detail-helper')
            .drop();
        } finally {
          await mongoClient.close();
        }
      });

      it('creates a new view', function (done) {
        dataService.createView(
          'myView',
          'data-service.test-instance-detail-helper',
          [{ $project: { a: 0 } }],
          {},
          function (err) {
            if (err) return done(err);
            done();
          }
        );
      });

      it('gets the instance details', function (done) {
        dataService.instance({}, function (err, res) {
          if (err) return done(err);
          instanceDetails = res;
          done();
        });
      });

      it('includes the view details in instance details', function () {
        const db = _.find(instanceDetails.databases, ['_id', 'data-service']);
        const viewInfo = _.find(db.collections, ['name', 'myView']);

        expect(viewInfo).to.deep.equal({
          _id: 'data-service.myView',
          name: 'myView',
          database: 'data-service',
          readonly: true,
          collation: null,
          type: 'view',
          view_on: 'test-instance-detail-helper',
          pipeline: [{ $project: { a: 0 } }],
        });
      });

      it('drops the view', function (done) {
        dataService.dropView('data-service.myView', done);
      });
    });
  });
});
