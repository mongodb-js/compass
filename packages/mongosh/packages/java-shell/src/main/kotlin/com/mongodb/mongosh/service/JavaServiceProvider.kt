package com.mongodb.mongosh.service

import com.mongodb.client.MongoClient
import com.mongodb.client.MongoDatabase
import com.mongodb.client.model.*
import com.mongodb.client.result.UpdateResult
import com.mongodb.mongosh.MongoShellConverter
import com.mongodb.mongosh.ValueWrapper
import com.mongodb.mongosh.result.ArrayResult
import com.mongodb.mongosh.result.CommandException
import com.mongodb.mongosh.result.DocumentResult
import org.bson.Document
import org.graalvm.polyglot.HostAccess
import org.graalvm.polyglot.Value

@Suppress("NAME_SHADOWING")
internal class JavaServiceProvider(private val client: MongoClient,
                                   private val converter: MongoShellConverter,
                                   private val wrapper: ValueWrapper) : ReadableServiceProvider, WritableServiceProvider, AdminServiceProvider {

    @JvmField
    @HostAccess.Export
    val platform = 3

    @HostAccess.Export
    override fun runCommand(database: String, spec: Value): Value = promise {
        getDatabase(database, null).map { db ->
            if (spec.isString) {
                db.runCommand(Document(spec.asString(), 1))
            } else {
                db.runCommand(toDocument(spec, "spec"))
            }
        }
    }

    @HostAccess.Export
    override fun runCommandWithCheck(database: String, spec: Value, options: Value?): Value = promise {
        getDatabase(database, null).map { db ->
            val res = if (spec.isString) {
                db.runCommand(Document(spec.asString(), 1))
            } else {
                db.runCommand(toDocument(spec, "spec"))
            }
            if (!interpretAsBoolean(res["ok"])) {
                throw Exception("Command failed. Spec: ${if (spec.isString) spec.asString() else toDocument(spec, "spec")?.toJson()}. Result: ${res.toJson()}")
            }
            res
        }
    }

    private fun interpretAsBoolean(v: Any?): Boolean {
        return (v as? Number)?.toInt()?.equals(1)
                ?: v as? Boolean
                ?: false
    }

    @HostAccess.Export
    override fun insertOne(database: String, collection: String, document: Value?, options: Value?): Value = promise {
        val document = toDocument(document, "document")
        val options = toDocument(options, "options")
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).map { db ->
            db.getCollection(collection).insertOne(document)
            mapOf("acknowledged" to true, "insertedId" to "UNKNOWN")
        }
    }

    @HostAccess.Export
    override fun replaceOne(database: String, collection: String, filter: Value, replacement: Value, options: Value?): Value = promise {
        val filter = toDocument(filter, "filter")
        val replacement = toDocument(replacement, "replacement")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(ReplaceOptions(), replaceOptionsConverters, replaceOptionsDefaultConverter, opt).map { opt ->
                val res = db.getCollection(collection).replaceOne(filter, replacement, opt)
                mapOf("acknowledged" to res.wasAcknowledged(),
                        "matchedCount" to res.matchedCount,
                        "modifiedCount" to res.modifiedCount,
                        "upsertedCount" to if (res.upsertedId == null) 0 else 1,
                        "upsertedId" to res.upsertedId)
            }
        }
    }

    @HostAccess.Export
    override fun updateMany(database: String, collection: String, filter: Value, update: Value, options: Value?): Value = promise<Any?> {
        val filter = toDocument(filter, "filter")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(UpdateOptions(), updateConverters, updateDefaultConverter, opt).flatMap { updateOptions ->
                when {
                    update.hasArrayElements() -> {
                        val updatePipeline = toList(update, "update")
                        if (updatePipeline == null || updatePipeline.any { it !is Document }) Left<UpdateResult>(IllegalArgumentException("updatePipeline must be a list of objects"))
                        else Right(db.getCollection(collection).updateMany(filter, updatePipeline.filterIsInstance<Document>(), updateOptions))
                    }
                    update.hasMembers() -> Right(db.getCollection(collection).updateMany(filter, toDocument(update, "update"), updateOptions))
                    else -> Left<UpdateResult>(IllegalArgumentException("updatePipeline must be a list or object"))
                }.map { res ->
                    mapOf("acknowledged" to res.wasAcknowledged(),
                            "matchedCount" to res.matchedCount,
                            "modifiedCount" to res.modifiedCount,
                            "upsertedCount" to if (res.upsertedId == null) 0 else 1,
                            "upsertedId" to res.upsertedId)
                }
            }
        }
    }

    @HostAccess.Export
    override fun updateOne(database: String, collection: String, filter: Value, update: Value, options: Value?): Value = promise<Any?> {
        val filter = toDocument(filter, "filter")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(UpdateOptions(), updateConverters, updateDefaultConverter, opt).map { updateOptions ->
                val coll = db.getCollection(collection)
                val res = if (update.hasArrayElements()) {
                    val pipeline = toList(update, "update")?.map { it as Document }
                    coll.updateOne(filter, pipeline, updateOptions)
                } else coll.updateOne(filter, toDocument(update, "update"), updateOptions)
                mapOf("acknowledged" to res.wasAcknowledged(),
                        "matchedCount" to res.matchedCount,
                        "modifiedCount" to res.modifiedCount,
                        "upsertedCount" to if (res.upsertedId == null) 0 else 1,
                        "upsertedId" to res.upsertedId)
            }
        }
    }

    @HostAccess.Export
    override fun save(database: String, collection: String, document: Value, options: Value?, dbOptions: Value?): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    private fun getDatabase(database: String, dbOptions: Map<String, Any?>?): Either<MongoDatabase> {
        val db = client.getDatabase(database)
        return if (dbOptions == null) Right(db) else convert(db, dbConverters, dbDefaultConverter, dbOptions)
    }

    @HostAccess.Export
    override fun dropDatabase(database: String, options: Value?): Value = promise<Any?> {
        getDatabase(database, null).map { db ->
            db.drop()
            mapOf("ok" to 1, "dropped" to database)
        }
    }

    @HostAccess.Export
    override fun bulkWrite(database: String, collection: String, requests: Value, options: Value?): Value = promise<Any?> {
        val requests = toList(requests, "requests")
        if (requests == null || requests.any { it !is Document }) return@promise Left(IllegalArgumentException("requests must be a list of objects"))
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(BulkWriteOptions(), bulkWriteOptionsConverters, bulkWriteOptionsDefaultConverter, opt).flatMap { options ->
                val writeModels = requests.map { getWriteModel(it as Document) }
                unwrap(writeModels).map { requests ->
                    val result = db.getCollection(collection).bulkWrite(requests, options)
                    mapOf(
                            "ok" to result.wasAcknowledged(),
                            "insertedCount" to result.insertedCount,
                            "insertedIds" to "UNKNOWN",
                            "matchedCount" to result.matchedCount,
                            "modifiedCount" to result.modifiedCount,
                            "deletedCount" to result.deletedCount,
                            "upsertedCount" to result.upserts.size,
                            "upsertedIds" to result.upserts.map { it.id })
                }
            }
        }
    }

    private fun <T> unwrap(l: List<Either<T>>): Either<List<T>> {
        return Right(l.map {
            when (it) {
                is Left -> return Left(it.value)
                is Right -> it.value
            }
        })
    }

    private fun getWriteModel(model: Document): Either<WriteModel<Document>> {
        if (model.keys.size != 1) return Left(IllegalArgumentException())
        val key = model.keys.first()
        val innerDoc: Document = model[key] as? Document
                ?: return Left(IllegalArgumentException("Inner object must be an instance of object. $model"))
        return when (key) {
            "insertOne" -> {
                val doc = innerDoc["document"] as? Document
                        ?: return Left(IllegalArgumentException("No property 'document' $innerDoc"))
                Right(InsertOneModel(doc))
            }
            "deleteOne", "deleteMany" -> {
                val filter = innerDoc["filter"] as? Document
                        ?: return Left(IllegalArgumentException("No property 'filter' $innerDoc"))
                val collationDoc = innerDoc["collation"] as? Document ?: Document()
                convert(Collation.builder(), collationConverters, collationDefaultConverter, collationDoc).map { collation ->
                    val opt = DeleteOptions().collation(collation.build())
                    if (key == "deleteOne") DeleteOneModel<Document>(filter, opt)
                    else DeleteManyModel<Document>(filter, opt)
                }
            }
            "updateOne", "updateMany" -> {
                val filter = innerDoc["filter"] as? Document
                        ?: return Left(IllegalArgumentException("No property 'filter' $innerDoc"))
                val update = innerDoc["update"]
                        ?: return Left(IllegalArgumentException("No property 'update' $innerDoc"))
                convert(UpdateOptions(), updateOptionsConverters, updateOptionsDefaultConverter, innerDoc).flatMap { opt ->
                    val res: Either<WriteModel<Document>> = when (update) {
                        is Document -> {
                            val model: WriteModel<Document> = if (key == "updateOne") UpdateOneModel(filter, update, opt) else UpdateManyModel(filter, update, opt)
                            Right(model)
                        }
                        is List<*> -> {
                            val model: WriteModel<Document> = if (key == "updateOne") UpdateOneModel(filter, update.filterIsInstance<Document>(), opt) else UpdateManyModel(filter, update.filterIsInstance<Document>(), opt)
                            Right(model)
                        }
                        else -> Left(IllegalArgumentException("Property 'update' has to be a document of a list $innerDoc"))
                    }
                    res
                }
            }
            "replaceOne" -> {
                val filter = innerDoc["filter"] as? Document
                        ?: return Left(IllegalArgumentException("No property 'filter' $innerDoc"))
                val replacement = innerDoc["replacement"] as? Document
                        ?: return Left(IllegalArgumentException("No property 'replacement' $innerDoc"))
                convert(ReplaceOptions(), replaceOptionsConverters, replaceOptionsDefaultConverter, innerDoc).map { opt ->
                    ReplaceOneModel<Document>(filter, replacement, opt)
                }
            }
            else -> Left(IllegalArgumentException("Unknown bulk write operation $model"))
        }
    }

    @HostAccess.Export
    override fun deleteMany(database: String, collection: String, filter: Value, options: Value?): Value = promise {
        val filter = toDocument(filter, "filter")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(DeleteOptions(), deleteConverters, deleteDefaultConverter, opt).map { deleteOptions ->
                val result = db.getCollection(collection).deleteMany(filter, deleteOptions)
                mapOf("acknowledged" to result.wasAcknowledged(),
                        "deletedCount" to result.deletedCount)
            }
        }
    }

    @HostAccess.Export
    override fun deleteOne(database: String, collection: String, filter: Value, options: Value?): Value = promise<Any?> {
        val filter = toDocument(filter, "filter")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(DeleteOptions(), deleteConverters, deleteDefaultConverter, opt).map { deleteOptions ->
                val result = db.getCollection(collection).deleteOne(filter, deleteOptions)
                mapOf("acknowledged" to result.wasAcknowledged(),
                        "deletedCount" to result.deletedCount)
            }
        }
    }

    @HostAccess.Export
    override fun findOneAndDelete(database: String, collection: String, filter: Value, options: Value?): Value = promise<Any?> {
        val filter = toDocument(filter, "filter")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(FindOneAndDeleteOptions(), findOneAndDeleteConverters, findOneAndDeleteDefaultConverter, opt).map { opt ->
                val res = db.getCollection(collection).findOneAndDelete(filter, opt)
                mapOf("value" to res)
            }
        }
    }

    @HostAccess.Export
    override fun findOneAndReplace(database: String, collection: String, filter: Value, replacement: Value, options: Value?): Value = promise {
        val filter = toDocument(filter, "filter")
        val replacement = toDocument(replacement, "replacement")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(FindOneAndReplaceOptions(), findOneAndReplaceOptionsConverters, findOneAndReplaceOptionsDefaultConverters, opt)
                    .map { opt ->
                        val res = db.getCollection(collection).findOneAndReplace(filter, replacement, opt)
                        mapOf("value" to res)
                    }
        }
    }

    @HostAccess.Export
    override fun findOneAndUpdate(database: String, collection: String, filter: Value, update: Value, options: Value?): Value = promise<Any?> {
        val filter = toDocument(filter, "filter")
        val update = toDocument(update, "update")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(FindOneAndUpdateOptions(), findOneAndUpdateConverters, findOneAndUpdateDefaultConverter, opt).map { opt ->
                val res = db.getCollection(collection).findOneAndUpdate(filter, update, opt)
                mapOf("value" to res)
            }
        }

    }

    @HostAccess.Export
    override fun insertMany(database: String, collection: String, docs: Value?, options: Value?): Value = promise<Any?> {
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        val docs = toList(docs, "docs")
        if (docs == null || docs.any { it !is Document }) return@promise Left(IllegalArgumentException("docs must be a list of objects"))
        getDatabase(database, dbOptions).flatMap { db ->
            convert(InsertManyOptions(), insertManyConverters, insertManyDefaultConverter, opt).map { opt ->
                db.getCollection(collection).insertMany(docs.filterIsInstance<Document>(), opt)
                mapOf("acknowledged" to true,
                        "insertedIds" to emptyList<String>())
            }
        }
    }

    @HostAccess.Export
    override fun aggregate(database: String, collection: String, pipeline: Value?, options: Value?, dbOptions: Value?): Cursor {
        val pipeline = toList(pipeline, "pipeline")
        if (pipeline == null || pipeline.any { it !is Document }) throw IllegalArgumentException("pipeline must be a list of objects")
        val options = toDocument(options, "options")
        val dbOptions = toDocument(dbOptions, "dbOptions")
        val db = getDatabase(database, dbOptions).getOrThrow()
        val createOptions = AggregateCreateOptions(db, collection, pipeline.filterIsInstance<Document>())
        val opt = options ?: Document()
        return Cursor(AggregateIterableHelper(aggregate(opt, createOptions), converter, opt, createOptions), converter, wrapper)
    }

    @HostAccess.Export
    override fun aggregateDb(database: String, pipeline: Value?, options: Value?, dbOptions: Value?): Cursor {
        val pipeline = toList(pipeline, "pipeline")
        if (pipeline == null || pipeline.any { it !is Document }) throw IllegalArgumentException("pipeline must be a list of objects")
        val options = toDocument(options, "options")
        val dbOptions = toDocument(dbOptions, "dbOptions")
        val db = getDatabase(database, dbOptions).getOrThrow()
        val createOptions = AggregateCreateOptions(db, null, pipeline.filterIsInstance<Document>())
        val opt = options ?: Document()
        return Cursor(AggregateIterableHelper(aggregate(opt, createOptions), converter, opt, createOptions), converter, wrapper)
    }

    @HostAccess.Export
    override fun count(database: String, collection: String, query: Value?, options: Value?): Value = promise {
        val query = toDocument(query, "query")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(CountOptions(), countOptionsConverters, countOptionsDefaultConverter, opt).map { countOptions ->
                db.getCollection(collection).countDocuments(query, countOptions)
            }
        }
    }

    @HostAccess.Export
    override fun countDocuments(database: String, collection: String, filter: Value?, options: Value?): Value = promise {
        val filter = toDocument(filter, "filter")
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(CountOptions(), countOptionsConverters, countOptionsDefaultConverter, opt).map { countOptions ->
                db.getCollection(collection).countDocuments(filter, countOptions)
            }
        }
    }

    @HostAccess.Export
    override fun distinct(database: String, collection: String, fieldName: String, filter: Value?, options: Value?): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun estimatedDocumentCount(database: String, collection: String, options: Value?): Value = promise<Any?> {
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) }
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            convert(EstimatedDocumentCountOptions(), estimatedCountOptionsConverters, estimatedCountOptionsDefaultConverter, opt).map { countOptions ->
                db.getCollection(collection).estimatedDocumentCount(countOptions)
            }
        }
    }

    @HostAccess.Export
    override fun find(database: String, collection: String, filter: Value?, options: Value?): Cursor {
        val filter = toDocument(filter, "filter")
        val options = toDocument(options, "options")
        val db = client.getDatabase(database)
        val createOptions = FindCreateOptions(db, collection, filter ?: Document())
        val opt = options ?: Document()
        return Cursor(FindIterableHelper(find(opt, createOptions), converter, opt, createOptions), converter, wrapper)
    }

    private fun toDocument(value: Value?, fieldName: String): Document? {
        if (value == null || value.isNull) return null
        if (!value.hasMembers()) {
            throw IllegalArgumentException("$fieldName should be an object: $value")
        }
        return (converter.toJava(value) as DocumentResult).value
    }

    private fun toList(value: Value?, fieldName: String): List<Any?>? {
        if (value == null || value.isNull) return null
        if (!value.hasArrayElements()) {
            throw IllegalArgumentException("$fieldName should be a list: $value")
        }
        return (converter.toJava(value) as ArrayResult).value
    }

    @HostAccess.Export
    override fun getTopology(): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun listDatabases(database: String, options: Value?): Value = promise {
        Right(mapOf("databases" to client.listDatabases()))
    }

    @HostAccess.Export
    override fun getNewConnection(uri: String, options: Value?): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun readPreferenceFromOptions(options: Value?): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun getConnectionInfo(): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun authenticate(authDoc: Value): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun isCapped(database: String, collection: String): Value = promise {
        getDatabase(database, null).flatMap { db ->
            val doc = db.runCommand(Document("collStats", collection))
            if (doc.containsKey("capped") && doc["capped"] is Boolean) Right<Boolean>(doc["capped"] as Boolean)
            else Left<Boolean>(CommandException("Cannot find boolean property 'capped'. Response $doc", ""))
        }
    }

    @HostAccess.Export
    override fun getIndexes(database: String, collection: String, options: Value?): Value = promise {
        getDatabase(database, null).map { db ->
            db.getCollection(collection).listIndexes()
        }
    }

    @HostAccess.Export
    override fun listCollections(database: String, filter: Value?, options: Value?): Value = promise {
        val filter = toDocument(filter, "filter")
        getDatabase(database, null).map { db ->
            val list = db.listCollections()
            if (filter != null) list.filter(filter)
            list
        }
    }

    @HostAccess.Export
    override fun stats(database: String, collection: String, options: Value?): Value = promise<Any?> {
        getDatabase(database, null).map { db ->
            db.runCommand(Document("collStats", collection))
        }
    }

    @HostAccess.Export
    override fun remove(database: String, collection: String, query: Value, options: Value?): Value = deleteMany(database, collection, query, options)

    @HostAccess.Export
    override fun createCollection(database: String, collection: String, options: Value?): Value = promise {
        val options = toDocument(options, "options")
        val opt = options?.filterKeys { !dbConverters.containsKey(it) } ?: Document()
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            val viewOn = opt["viewOn"]
            if (viewOn is String) {
                convert(CreateViewOptions(), createViewOptionsConverters, createViewOptionsConverter, opt).map { createViewOptions ->
                    val pipeline = (opt["pipeline"] as? List<*>)?.filterIsInstance(Document::class.java)
                    db.createView(collection, viewOn, pipeline?.toMutableList() ?: mutableListOf(), createViewOptions)
                }
            }
            else {
                convert(CreateCollectionOptions(), createCollectionOptionsConverters, createCollectionOptionsConverter, opt).map { opt ->
                    db.createCollection(collection, opt)
                }
            }
        }
    }

    @HostAccess.Export
    override fun getReadPreference(): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun getReadConcern(): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun getWriteConcern(): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun resetConnectionOptions(): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun createIndexes(database: String, collection: String, indexSpecs: Value?, options: Value?): Value = promise<Any?> {
        val indexSpecs = toList(indexSpecs, "indexSpecs") ?: emptyList()
        if (indexSpecs.any { it !is Document }) throw IllegalArgumentException("Index specs must be a list of documents. Got $indexSpecs")
        val options = toDocument(options, "options")
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).flatMap { db ->
            val convertedIndexes = indexSpecs.map { spec ->
                convert(IndexModel(Document()), indexModelConverters, indexModelDefaultConverter, spec as Document)
            }
            val indexes = unwrap(convertedIndexes)
            indexes.map { indexes ->
                db.getCollection(collection).createIndexes(indexes)
            }
        }
    }

    @HostAccess.Export
    override fun dropCollection(database: String, collection: String, options: Value?): Value = promise {
        val options = toDocument(options, "options")
        val dbOptions = options?.filterKeys { dbConverters.containsKey(it) }
        getDatabase(database, dbOptions).map { db ->
            db.getCollection(collection).drop()
        }
    }

    @HostAccess.Export
    override fun renameCollection(database: String, oldName: String, newName: String, options: Value?, dbOptions: Value?): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    @HostAccess.Export
    override fun initializeBulkOp(database: String, collection: String, ordered: Boolean, options: Value?, dbOptions: Value?): Value = promise<Any?> {
        Left(NotImplementedError())
    }

    private fun <T> promise(block: () -> Either<T>): Value {
        return converter.toJsPromise(block())
    }
}
