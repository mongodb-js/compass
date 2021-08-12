"use strict";
const EventEmitter = require("events");
class DataService extends EventEmitter {
    constructor(model) {
        super();
        this.lastSeenTopology = null;
        this.client = null;
        const NativeClient = require("./native-client");
        this.client = new NativeClient(model)
            .on("status", (evt) => this.emit("status", evt))
            .on("serverDescriptionChanged", (evt) => this.emit("serverDescriptionChanged", evt))
            .on("serverOpening", (evt) => this.emit("serverOpening", evt))
            .on("serverClosed", (evt) => this.emit("serverClosed", evt))
            .on("topologyOpening", (evt) => this.emit("topologyOpening", evt))
            .on("topologyClosed", (evt) => this.emit("topologyClosed", evt))
            .on("topologyDescriptionChanged", (evt) => {
            this.lastSeenTopology = evt.newDescription;
            this.emit("topologyDescriptionChanged", evt);
        });
    }
    getConnectionOptions() {
        return this.client.connectionOptions;
    }
    collection(ns, options, callback) {
        this.client.collectionDetail(ns, callback);
    }
    collectionStats(databaseName, collectionName, callback) {
        this.client.collectionStats(databaseName, collectionName, callback);
    }
    command(databaseName, comm, callback) {
        this.client.command(databaseName, comm, callback);
    }
    isWritable() {
        return this.client.isWritable;
    }
    isMongos() {
        return this.client.isMongos;
    }
    buildInfo(callback) {
        this.client.buildInfo(callback);
    }
    hostInfo(callback) {
        this.client.hostInfo(callback);
    }
    connectionStatus(callback) {
        this.client.connectionStatus(callback);
    }
    usersInfo(authenticationDatabase, options, callback) {
        this.client.usersInfo(authenticationDatabase, options, callback);
    }
    listCollections(databaseName, filter, callback) {
        this.client.listCollections(databaseName, filter, callback);
    }
    listDatabases(callback) {
        this.client.listDatabases(callback);
    }
    connect(done) {
        this.client.connect((err) => {
            if (err) {
                return done(err);
            }
            done(null, this);
            this.emit("readable");
        });
    }
    estimatedCount(ns, options, callback) {
        this.client.estimatedCount(ns, options, callback);
    }
    count(ns, filter, options, callback) {
        this.client.count(ns, filter, options, callback);
    }
    createCollection(ns, options, callback) {
        this.client.createCollection(ns, options, callback);
    }
    createIndex(ns, spec, options, callback) {
        this.client.createIndex(ns, spec, options, callback);
    }
    database(name, options, callback) {
        this.client.databaseDetail(name, callback);
    }
    deleteOne(ns, filter, options, callback) {
        this.client.deleteOne(ns, filter, options, callback);
    }
    deleteMany(ns, filter, options, callback) {
        this.client.deleteMany(ns, filter, options, callback);
    }
    disconnect(callback) {
        this.client.disconnect(callback);
    }
    dropCollection(ns, callback) {
        this.client.dropCollection(ns, callback);
    }
    dropDatabase(name, callback) {
        this.client.dropDatabase(name, callback);
    }
    dropIndex(ns, name, callback) {
        this.client.dropIndex(ns, name, callback);
    }
    aggregate(ns, pipeline, options, callback) {
        return this.client.aggregate(ns, pipeline, options, callback);
    }
    find(ns, filter, options, callback) {
        this.client.find(ns, filter, options, callback);
    }
    fetch(ns, filter, options) {
        return this.client.fetch(ns, filter, options);
    }
    findOneAndReplace(ns, filter, replacement, options, callback) {
        this.client.findOneAndReplace(ns, filter, replacement, options, callback);
    }
    findOneAndUpdate(ns, filter, update, options, callback) {
        this.client.findOneAndUpdate(ns, filter, update, options, callback);
    }
    explain(ns, filter, options, callback) {
        this.client.explain(ns, filter, options, callback);
    }
    indexes(ns, options, callback) {
        this.client.indexes(ns, callback);
    }
    instance(options, callback) {
        this.client.instance(callback);
    }
    insertOne(ns, doc, options, callback) {
        this.client.insertOne(ns, doc, options, callback);
    }
    insertMany(ns, docs, options, callback) {
        this.client.insertMany(ns, docs, options, callback);
    }
    putMany(ns, docs, options) {
        return this.client.putMany(ns, docs, options);
    }
    updateCollection(ns, flags, callback) {
        this.client.updateCollection(ns, flags, callback);
    }
    updateOne(ns, filter, update, options, callback) {
        this.client.updateOne(ns, filter, update, options, callback);
    }
    updateMany(ns, filter, update, options, callback) {
        this.client.updateMany(ns, filter, update, options, callback);
    }
    currentOp(includeAll, callback) {
        this.client.currentOp(includeAll, callback);
    }
    getLastSeenTopology() {
        return this.lastSeenTopology;
    }
    serverstats(callback) {
        this.client.serverStats(callback);
    }
    shardedCollectionDetail(ns, callback) {
        this.client.shardedCollectionDetail(ns, callback);
    }
    top(callback) {
        this.client.top(callback);
    }
    createView(name, sourceNs, pipeline, options, callback) {
        this.client.createView(name, sourceNs, pipeline, options, callback);
    }
    updateView(name, sourceNs, pipeline, options, callback) {
        this.client.updateView(name, sourceNs, pipeline, options, callback);
    }
    dropView(ns, callback) {
        this.client.dropView(ns, callback);
    }
    sample(...args) {
        return this.client.sample(...args);
    }
    startSession(...args) {
        return this.client.startSession(...args);
    }
    killSession(...args) {
        return this.client.killSession(...args);
    }
    isConnected() {
        return this.client.isConnected();
    }
    _generateArguments(args, options, callback) {
        options = options || {};
        if (typeof options === "function") {
            callback = options;
            options = {};
        }
        args.push.apply(args, [options, callback]);
        return args;
    }
}
module.exports = DataService;
//# sourceMappingURL=data-service.js.map