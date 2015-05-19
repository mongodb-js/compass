var mongoscope = window.mongoscopeClient, $ = window.jQuery;

mongoscope.configure({
  endpoint: 'http://scope.mongodb.land',
  mongodb: 'localhost:30999'
});

var report = '',
  $el = $('#container pre');

function buf(s){
  report += s + '\n';
}
function draw(){
  $el.text(report);
}

mongoscope.sharding(function(err, res){
  if(err){
    return $el.text('Error:' + JSON.stringify(err));
  }

  buf('# ' + res.name + ' sharding report');

  buf('## collections\n');
  res.collections.map(function(col){
    buf('### `' + col._id + '`\n');
    buf('- shard on `' + JSON.stringify(col.shard_key) + '`');
    buf('- tags `' + (col.tags.length ? col.tags.join(', ') : 'none') + '`');
    buf('- storage ' + col.stats.storage_size +
        ', documents ' + col.stats.document_size +
        ', indexes ' + col.stats.index_size);
    buf('- documents ' + col.stats.document_count);
    buf('- indexes ' + col.stats.index_count);

    // @todo: there should be some tolerance to showing warnings if
    // distribution is off target.
    var target = (1/col.shards.length) * 100;

    buf('- target distribution per shard ' + target + '%');
    buf();

    col.shards.map(function(s){
      buf('#### `' + s._id + '`\n');
      s.warnings = [];

      if(s.stats.document_count === 0){
        return buf('- **warning** empty shard\n');
      }

      s.stats.document_share = (s.stats.document_count/col.stats.document_count * 100).toFixed(2);
      s.stats.document_storage_share = (s.stats.document_size/col.stats.document_size * 100).toFixed(2);
      s.stats.storage_share = (s.stats.storage_size/col.stats.storage_size * 100).toFixed(2);

      if(s.stats.document_share > target){
        s.warnings.push('EHIGHDOCS');
      }
      else if(s.stats.document_share < target){
        s.warnings.push('ELOWDOCS');
      }

      if(s.stats.document_storage_share > target){
        s.warnings.push('EHIGHDOCSTOR');
      }
      else if(s.stats.document_storage_share < target){
        s.warnings.push('ELOWDOCSTOR');
      }

      if(s.stats.storage_share > target){
        s.warnings.push('EHIGHSTOR');
      }
      else if(s.stats.storage_share < target){
        s.warnings.push('ELOWSTOR');
      }

      if(s.warnings){
        buf('- **warning** ' + s.warnings.join(', '));
      }

      buf('- documents (' + s.stats.document_share + '%) ' + 'storage (' + s.stats.document_storage_share + '%)');

      buf();
      s.chunks.map(function(chunk){
        buf('##### `' + chunk._id + '`\n');
        buf('- last modified: ' + chunk.last_modified_on);
        buf('- ' + JSON.stringify(chunk.keyspace[0]) + ' → ' + JSON.stringify(chunk.keyspace[1]));
        buf();
      });
    });
  });

  buf('## topology');
  var l = null;
  res.instances.map(function(i){
    if(i.shard !== l){
      l = i.shard;
      if(l){
        buf('\n### `' + l + '`\n');
      }
      else {
        buf('\n### routers\n');
      }
    }
    buf('  - [' + i.name + '](http://scope.mongodb.land/#connect/'+i.url+')');
  });

  buf();
  buf('## other databases\n');
  res.databases.map(function(db){
    if(db.partitioned) return;
    buf('- ' + db._id + '(' + db.primary + ')');
  });

  draw();
});
