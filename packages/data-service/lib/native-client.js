"use strict";
const { map, isFunction, assignIn } = require("lodash");
const async = require("async");
const EventEmitter = require("events");
const connect = require("mongodb-connection-model").connect;
const getIndexes = require("mongodb-index-model").fetch;
const parseNamespace = require("mongodb-ns");
const { getInstance } = require("./instance-detail-helper");
const debug = require("debug")("mongodb-data-service:native-client");
const SHARDED = "Sharded";
const SINGLE = "Single";
const RS_WITH_PRIMARY = "ReplicaSetWithPrimary";
const RS_PRIMARY = "RSPrimary";
const STANDALONE = "Standalone";
const MONGOS = "Mongos";
const WRITABLE_SERVER_TYPES = [RS_PRIMARY, STANDALONE, MONGOS];
const WRITABLE_TYPES = [SHARDED, SINGLE, RS_WITH_PRIMARY];
const VIEW_ERROR = "is a view, not a collection";
const SYSTEM = "system";
const ADMIN = "admin";
const DEFAULT_SAMPLE_SIZE = 1000;
function getFirstFromMap(_map) {
    return _map.values().next().value;
}
class NativeClient extends EventEmitter {
    constructor(model) {
        super();
        this.model = model;
        this.connectionOptions = null;
        this.tunnel = null;
        this.isWritable = false;
        this.isMongos = false;
        this._isConnecting = false;
    }
    isConnected() {
        return !!this.client;
    }
    connect(done) {
        debug("connecting...");
        if (this._isConnecting) {
            setImmediate(() => {
                done(new Error("Connect method has been called more than once without disconnecting."));
            });
            return this;
        }
        this._isConnecting = true;
        connect(this.model, this.setupListeners.bind(this), (err, _client, tunnel, connectionOptions) => {
            if (err) {
                this._isConnecting = false;
                return done(this._translateMessage(err));
            }
            this.connectionOptions = connectionOptions;
            this.tunnel = tunnel;
            this.isWritable = this.client.isWritable;
            this.isMongos = this.client.isMongos;
            debug("connected!", {
                isWritable: this.isWritable,
                isMongos: this.isMongos,
            });
            this.client.on("status", (evt) => this.emit("status", evt));
            this.database = this.client.db(this.model.ns || ADMIN);
            done(null, this);
        });
        return this;
    }
    setupListeners(client) {
        this.client = client;
        if (client) {
            client.on("serverDescriptionChanged", (evt) => {
                debug("serverDescriptionChanged", evt);
                this.emit("serverDescriptionChanged", evt);
            });
            client.on("serverOpening", (evt) => {
                debug("serverOpening", arguments);
                this.emit("serverOpening", evt);
            });
            client.on("serverClosed", (evt) => {
                debug("serverClosed", arguments);
                this.emit("serverClosed", evt);
            });
            client.on("topologyOpening", (evt) => {
                debug("topologyOpening", arguments);
                this.emit("topologyOpening", evt);
            });
            client.on("topologyClosed", (evt) => {
                debug("topologyClosed", arguments);
                this.emit("topologyClosed", evt);
            });
            client.on("topologyDescriptionChanged", (evt) => {
                debug("topologyDescriptionChanged", arguments);
                client.isWritable = this._isWritable(evt);
                client.isMongos = this._isMongos(evt);
                debug("updated to", {
                    isWritable: client.isWritable,
                    isMongos: client.isMongos,
                });
                this.emit("topologyDescriptionChanged", evt);
            });
            client.on("serverHeartbeatSucceeded", (evt) => {
                debug("serverHeartbeatSucceeded", arguments);
                this.emit("serverHeartbeatSucceeded", evt);
            });
            client.on("serverHeartbeatFailed", (evt) => {
                debug("serverHeartbeatFailed", arguments);
                this.emit("serverHeartbeatFailed", evt);
            });
        }
    }
    command(databaseName, comm, callback) {
        var db = this._database(databaseName);
        db.command(comm, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    estimatedCount(ns, options, callback) {
        this._collection(ns).estimatedDocumentCount(options, callback);
    }
    count(ns, filter, options, callback) {
        this._collection(ns).countDocuments(filter, options, callback);
    }
    collectionDetail(ns, callback) {
        async.parallel({
            stats: this.collectionStats.bind(this, this._databaseName(ns), this._collectionName(ns)),
            indexes: this.indexes.bind(this, ns),
        }, (error, coll) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, this._buildCollectionDetail(ns, coll));
        });
    }
    listCollections(databaseName, filter, callback) {
        var db = this._database(databaseName);
        db.listCollections(filter, {}).toArray((error, data) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, data);
        });
    }
    listDatabases(callback) {
        this.database.admin().command({
            listDatabases: 1,
        }, {
            readPreference: this.model.readPreference,
        }, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result.databases);
        });
    }
    collections(databaseName, callback) {
        if (databaseName === SYSTEM) {
            return callback(null, []);
        }
        this.collectionNames(databaseName, (error, names) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            async.parallel(map(names, (name) => {
                return (done) => {
                    this.collectionStats(databaseName, name, done);
                };
            }), callback);
        });
    }
    collectionNames(databaseName, callback) {
        this.listCollections(databaseName, {}, (error, collections) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            var names = map(collections, (collection) => {
                return collection.name;
            });
            callback(null, names);
        });
    }
    currentOp(includeAll, callback) {
        this.database
            .admin()
            .command({ currentOp: 1, $all: includeAll }, (error, result) => {
            if (error) {
                this._database("admin")
                    .collection("$cmd.sys.inprog")
                    .findOne({ $all: includeAll }, (error2, result2) => {
                    if (error2) {
                        return callback(this._translateMessage(error2));
                    }
                    callback(null, result2);
                });
                return;
            }
            callback(null, result);
        });
    }
    serverStats(callback) {
        this.database.admin().serverStatus((error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    top(callback) {
        this.database.admin().command({ top: 1 }, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    collectionStats(databaseName, collectionName, callback) {
        var db = this._database(databaseName);
        db.command({ collStats: collectionName, verbose: true }, (error, data) => {
            if (error && !error.message.includes(VIEW_ERROR)) {
                return callback(this._translateMessage(error));
            }
            callback(null, this._buildCollectionStats(databaseName, collectionName, data || {}));
        });
    }
    createCollection(ns, options, callback) {
        var collectionName = this._collectionName(ns);
        var db = this._database(this._databaseName(ns));
        db.createCollection(collectionName, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    createIndex(ns, spec, options, callback) {
        this._collection(ns).createIndex(spec, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    databaseDetail(name, callback) {
        async.parallel({
            stats: this.databaseStats.bind(this, name),
            collections: this.collections.bind(this, name),
        }, (error, db) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, this._buildDatabaseDetail(name, db));
        });
    }
    databaseStats(name, callback) {
        var db = this._database(name);
        db.command({ dbStats: 1 }, (error, data) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, this._buildDatabaseStats(data));
        });
    }
    deleteOne(ns, filter, options, callback) {
        this._collection(ns).deleteOne(filter, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    deleteMany(ns, filter, options, callback) {
        this._collection(ns).deleteMany(filter, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    disconnect(callback) {
        if (!this.client) {
            setImmediate(() => {
                callback();
            });
            return;
        }
        this.client.close(true, (err) => {
            if (this.tunnel) {
                debug("mongo client closed. shutting down ssh tunnel");
                this.tunnel.close().finally(() => {
                    this._cleanup();
                    debug("ssh tunnel stopped");
                    callback(err);
                });
            }
            else {
                this._cleanup();
                return callback(err);
            }
        });
    }
    dropCollection(ns, callback) {
        this._collection(ns).drop((error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    dropDatabase(name, callback) {
        this._database(this._databaseName(name)).dropDatabase((error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    dropIndex(ns, name, callback) {
        this._collection(ns).dropIndex(name, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    aggregate(ns, pipeline, options, callback) {
        if (typeof options === "function") {
            callback = options;
            options = undefined;
        }
        const cursor = this._collection(ns).aggregate(pipeline, options);
        if (isFunction(callback)) {
            process.nextTick(callback, null, cursor);
            return;
        }
        return cursor;
    }
    find(ns, filter = {}, options = {}, callback = () => { }) {
        const sort = options.sort;
        delete options.sort;
        let cursor = this._collection(ns).find(filter, options);
        if (sort) {
            cursor = cursor.sort(sort);
        }
        cursor.toArray((error, documents) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, documents);
        });
    }
    fetch(ns, filter, options) {
        return this._collection(ns).find(filter, options);
    }
    findOneAndReplace(ns, filter, replacement, options, callback) {
        this._collection(ns).findOneAndReplace(filter, replacement, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result.value);
        });
    }
    findOneAndUpdate(ns, filter, update, options, callback) {
        this._collection(ns).findOneAndUpdate(filter, update, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result.value);
        });
    }
    explain(ns, filter, options, callback) {
        this._collection(ns)
            .find(filter, options)
            .explain((error, explanation) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, explanation);
        });
    }
    indexes(ns, callback) {
        getIndexes(this.client, ns, (error, data) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, data);
        });
    }
    insertOne(ns, doc, options, callback) {
        this._collection(ns).insertOne(doc, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    insertMany(ns, docs, options, callback) {
        this._collection(ns).insertMany(docs, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    putMany(ns, docs, options) {
        return this._collection(ns).insertMany(docs, options);
    }
    instance(callback) {
        getInstance(this.client, this.database, (error, data) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, this._buildInstance(data));
        });
    }
    sample(ns, { query, size, fields } = {}, options = {}) {
        const pipeline = [];
        if (query && Object.keys(query).length > 0) {
            pipeline.push({
                $match: query,
            });
        }
        pipeline.push({
            $sample: {
                size: size === 0 ? 0 : size || DEFAULT_SAMPLE_SIZE,
            },
        });
        if (fields && Object.keys(fields).length > 0) {
            pipeline.push({
                $project: fields,
            });
        }
        return this.aggregate(ns, pipeline, {
            allowDiskUse: true,
            ...options,
        });
    }
    startSession() {
        return this.client.startSession();
    }
    killSession(clientSession) {
        return this.database.admin().command({
            killSessions: [clientSession.id],
        });
    }
    shardedCollectionDetail(ns, callback) {
        this.collectionDetail(ns, (error, data) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            if (!data.sharded) {
                return callback(null, data);
            }
            async.parallel(map(data.shards, (shardStats, shardName) => {
                return this._shardDistribution.bind(this, ns, shardName, data, shardStats);
            }), (err) => {
                if (err) {
                    return callback(this._translateMessage(err));
                }
                callback(null, data);
            });
        });
    }
    updateCollection(ns, flags, callback) {
        var collectionName = this._collectionName(ns);
        var db = this._database(this._databaseName(ns));
        var collMod = { collMod: collectionName };
        var command = assignIn(collMod, flags);
        db.command(command, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    updateOne(ns, filter, update, options, callback) {
        this._collection(ns).updateOne(filter, update, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    updateMany(ns, filter, update, options, callback) {
        this._collection(ns).updateMany(filter, update, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    createView(name, sourceNs, pipeline, options, callback) {
        options.viewOn = this._collectionName(sourceNs);
        options.pipeline = pipeline;
        this._database(this._databaseName(sourceNs)).createCollection(name, options, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    updateView(name, sourceNs, pipeline, options, callback) {
        options.viewOn = this._collectionName(sourceNs);
        options.pipeline = pipeline;
        var collMod = { collMod: name };
        var command = assignIn(collMod, options);
        var db = this._database(this._databaseName(sourceNs));
        db.command(command, (error, result) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            callback(null, result);
        });
    }
    dropView(ns, callback) {
        this.dropCollection(ns, callback);
    }
    _shardDistribution(ns, shardName, detail, shardStats, callback) {
        var configDb = this._database("config");
        configDb
            .collection("shards")
            .findOne({ _id: shardName }, (error, shardDoc) => {
            if (error) {
                return callback(this._translateMessage(error));
            }
            configDb
                .collection("chunks")
                .count({ ns: ns, shard: shardName }, (err, chunkCount) => {
                if (err) {
                    return callback(this._translateMessage(err));
                }
                Object.assign(shardStats, this._buildShardDistribution(detail, shardStats, shardDoc, chunkCount));
                callback(null);
            });
        });
    }
    _buildCollectionDetail(ns, data) {
        return assignIn(data.stats, {
            _id: ns,
            name: this._collectionName(ns),
            database: this._databaseName(ns),
            indexes: data.indexes,
        });
    }
    _buildShardDistribution(detail, shardStats, shardDoc, chunkCount) {
        return {
            host: shardDoc.host,
            shardData: shardStats.size,
            shardDocs: shardStats.count,
            estimatedDataPerChunk: shardStats.size / chunkCount,
            estimatedDocsPerChunk: Math.floor(shardStats.count / chunkCount),
            estimatedDataPercent: Math.floor((shardStats.size / detail.size || 0) * 10000) / 100,
            estimatedDocPercent: Math.floor((shardStats.count / detail.count || 0) * 10000) / 100,
        };
    }
    _buildCollectionStats(databaseName, collectionName, data) {
        return {
            ns: databaseName + "." + collectionName,
            name: collectionName,
            database: databaseName,
            is_capped: data.capped,
            max: data.max,
            is_power_of_two: data.userFlags === 1,
            index_sizes: data.indexSizes,
            document_count: data.count,
            document_size: data.size,
            storage_size: data.storageSize,
            index_count: data.nindexes,
            index_size: data.totalIndexSize,
            padding_factor: data.paddingFactor,
            extent_count: data.numExtents,
            extent_last_size: data.lastExtentSize,
            flags_user: data.userFlags,
            flags_system: data.systemFlags,
            max_document_size: data.maxSize,
            sharded: data.sharded || false,
            shards: data.shards || {},
            size: data.size,
            index_details: data.indexDetails || {},
            wired_tiger: data.wiredTiger || {},
        };
    }
    _buildDatabaseDetail(name, db) {
        return {
            _id: name,
            name: name,
            stats: db.stats,
            collections: db.collections,
        };
    }
    _buildDatabaseStats(data) {
        return {
            document_count: data.objects,
            document_size: data.dataSize,
            storage_size: data.storageSize,
            index_count: data.indexes,
            index_size: data.indexSize,
            extent_count: data.numExtents,
            file_size: data.fileSize,
            ns_size: data.nsSizeMB * 1024 * 1024,
        };
    }
    _buildInstance(data) {
        return assignIn(data, {
            _id: `${this.model.hostname}:${this.model.port}`,
            hostname: this.model.hostname,
            port: this.model.port,
        });
    }
    _collection(ns) {
        return this._database(this._databaseName(ns)).collection(this._collectionName(ns));
    }
    _collectionName(ns) {
        return parseNamespace(ns).collection;
    }
    _databaseName(ns) {
        return parseNamespace(ns).database;
    }
    _database(name) {
        return this.client.db(name);
    }
    _isWritable(evt) {
        const topologyType = evt.newDescription.type;
        if (topologyType === SINGLE) {
            const server = getFirstFromMap(evt.newDescription.servers);
            return server && WRITABLE_SERVER_TYPES.includes(server.type);
        }
        return WRITABLE_TYPES.includes(topologyType);
    }
    _isMongos(evt) {
        return evt.newDescription.type === SHARDED;
    }
    _translateMessage(error) {
        if (typeof error === "string") {
            error = { message: error };
        }
        else {
            error.message = error.message || error.err || error.errmsg;
        }
        return error;
    }
    _cleanup() {
        this.client = null;
        this.connectionOptions = null;
        this.tunnel = null;
        this.isWritable = false;
        this.isMongos = false;
        this._isConnecting = false;
    }
}
function addDebugToClass(cls) {
    if (!debug.enabled) {
        return cls;
    }
    const proto = cls.prototype;
    for (const prop of Object.getOwnPropertyNames(proto)) {
        if (prop.startsWith("_")) {
            continue;
        }
        const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
        if (typeof descriptor.value !== "function") {
            continue;
        }
        const orig = descriptor.value;
        descriptor.value = function (...args) {
            debug(`${prop}()`, args);
            if ((args.length > 0) & (typeof args[args.length - 1] === "function")) {
                const origCallback = args[args.length - 1];
                args[args.length - 1] = function (...callbackArgs) {
                    debug(`${prop}()`, args, "finished ->", callbackArgs);
                    return origCallback.call(this, ...callbackArgs);
                };
            }
            return orig.call(this, ...args);
        };
        Object.defineProperty(proto, prop, descriptor);
    }
    return cls;
}
module.exports = addDebugToClass(NativeClient);
//# sourceMappingURL=native-client.js.map