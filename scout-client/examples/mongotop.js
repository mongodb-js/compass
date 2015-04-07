// appease the jshint gods
var mongoscope = window.mongoscopeClient, asciiTable = window.asciiTable, $ = window.$;

mongoscope.configure({endpoint: 'http://scope.mongodb.land'});

var deltas = {}, namespaces = [];
var operations = ['queries', 'inserts', 'removes', 'updates', 'getmore'];

function loop(){
  mongoscope().top().on('data', function(data){
    deltas = data.deltas;
  });


  setInterval(function(){
    var table = new asciiTable('top: ' + new Date()),
      columns = ['namespace'];

    columns.push.apply(columns, operations);
    table.setHeading(columns);

    namespaces.map(function(namespace){
      var row = [namespace];
      row.push.apply(row, operations.map(function(op){
        return deltas[namespace + '.' + op + '.count'] || 0;
      }));
      table.addRow(row);
    });
    $('.container').append('<div class="row"><code><pre>'+table.toString()+'</pre></code></div>');
    document.body.scrollTop = document.body.scrollHeight;
    deltas = {};
  }, 1000);
}

mongoscope().top(function(err, data){
  if(err) return console.error(err);
  namespaces = data.namespaces;
  deltas = data.deltas;
  loop();
});

