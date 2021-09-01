import assert from 'assert';
import _ from 'lodash';
import { Db, MongoClient } from 'mongodb';
import * as helper from '../test/helper';
import DataService from './data-service';
import { getInstance } from './instance-detail-helper';
import { Instance } from './types';

describe('mongodb-data-service#instance', function () {
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
      assert(db);
      getInstance(client, db, function (err) {
        if (err) {
          return done(err);
        }
        db.admin().ping(function (_err) {
          if (_err) {
            done(_err);
          }
          done();
        });
      });
    });
    describe('views', function () {
      let service: DataService;
      let mongoClient: MongoClient;
      let instanceDetails: Instance;

      before(function (done) {
        if (process.env.MONGODB_TOPOLOGY === 'cluster') {
          return this.skip();
        }

        service = new DataService(helper.connectionOptions, helper.connection);
        service.connect(function (err) {
          if (err) return done(err);
          const opts = service.getMongoClientConnectionOptions();
          MongoClient.connect(opts!.url, opts!.options, (err, client) => {
            if (err) {
              return done(err);
            }
            mongoClient = client!;
            helper.insertTestDocuments(mongoClient, function () {
              done();
            });
          });
        });
      });

      after(function (done) {
        helper.deleteTestDocuments(mongoClient, function () {
          service.disconnect(function () {
            mongoClient.close(done);
          });
        });
      });

      it('creates a new view', function (done) {
        service.createView(
          'myView',
          'data-service.test',
          [{ $project: { a: 0 } }],
          {},
          function (err) {
            if (err) return done(err);
            done();
          }
        );
      });

      it('gets the instance details', function (done) {
        service.instance({}, function (err, res) {
          if (err) return done(err);
          instanceDetails = res;
          done();
        });
      });

      it('includes the view details in instance details', function () {
        const viewInfo = _.find(instanceDetails.collections, [
          '_id',
          'data-service.myView',
        ]);
        assert.deepEqual(viewInfo, {
          _id: 'data-service.myView',
          name: 'myView',
          database: 'data-service',
          readonly: true,
          collation: null,
          type: 'view',
          view_on: 'test',
          pipeline: [{ $project: { a: 0 } }],
        });
      });

      it('drops the view', function (done) {
        service.dropView('data-service.myView', done);
      });
    });
  });
});
