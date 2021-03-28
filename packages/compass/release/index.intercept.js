// NOTE:
// this file run commands mocking http requests before.
//
// you can use nock.recorder.rec(); to intercept other calls.

const nock = require('nock');
const path = require('path');

nock('https://info-mongodb-com.s3.amazonaws.com')
  .get('/com-download-center/compass.json')
  .replyWithFile(
    200, path.resolve(__dirname, 'fixtures', 'config.json'));

nock('https://info-mongodb-com.s3.amazonaws.com')
  .put('/com-download-center/compass.json')
  .reply(200);

nock('https://downloads.mongodb.com')
  .head(/.*/)
  .times(9999)
  .reply(200);

require('./index');

