/* eslint-disable */
print("Database Name;Collection Name;Documents;Documents Size;Documents Avg;Indexes;Index Size;Index Avg")
db.getSiblingDB('admin').runCommand({ listDatabases: 1, nameOnly: true }).databases.forEach(function (d) {
    if ( ["local", "config"].indexOf(d.name) > -1 ) { return; }
    var curr_db = db.getSiblingDB(d.name);
    curr_db.getCollectionNames().forEach(function(coll) {
        var c = curr_db.getCollection(coll);
        if ( typeof c != "function") {
    	    print(d.name + ";" + coll + ";" + c.stats().count + ";" + c.stats().size + ";" + c.stats().avgObjSize + ";" + c.stats().nindexes + ";" + c.stats().totalIndexSize + ";" + c.stats().totalIndexSize / c.stats().nindexes);
        }
    });
});
