nightmare = require 'nightmare'
browser = nightmare phantomPath: "#{__dirname}/../node_modules/.bin/"
gulp = require 'gulp'
createServer = require 'gulp-webserver'
server = null
{exec} = require 'child_process'

describe 'scout-ui', () ->
  before (done) ->
    exec 'npm run build', {cwd: __dirname + '/../'}, (err)->
      return done(err) if err?

      server = createServer host: 'localhost', port: 3001
      gulp.src('../dist').pipe(server).on('end', done)

  after ()->
    server.emit('kill')

  it 'should load', (done)->
    browser
      .goto 'http://localhost:3001/'
      .wait '.page-container'
      .run done
