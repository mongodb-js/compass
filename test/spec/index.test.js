var path = require('path');
var browser = require('nightmare')({
  phantomPath: path.resolve(__dirname, '../node_modules/.bin/')
});

var gulp = require('gulp');
var createServer = require('gulp-webserver');
var server;

describe('scout-ui', function() {
  before(function(done) {
    server = createServer({
      host: 'localhost',
      port: 3001
    });

    gulp.src('../dist')
      .pipe(server)
      .on('end', done);
  });
  after(function() {
    server.emit('kill');
  });
  it('should load', function(done) {
    browser
      .goto('http://localhost:3001/')
      .wait('.page-container')
      .run(done);
  });
});
