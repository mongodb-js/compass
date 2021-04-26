package com.mongodb.mongosh.service

import com.mongodb.*
import com.mongodb.client.AggregateIterable
import com.mongodb.client.FindIterable
import com.mongodb.client.MongoDatabase
import com.mongodb.client.MongoIterable
import com.mongodb.client.model.CountOptions
import com.mongodb.mongosh.MongoShellConverter
import com.mongodb.mongosh.result.DocumentResult
import org.bson.Document
import org.graalvm.polyglot.Value

internal abstract class BaseMongoIterableHelper<T : MongoIterable<*>>(val iterable: T, protected val converter: MongoShellConverter, protected val options: Document) {
    abstract val converters: Map<String, (T, Any?) -> Either<T>>
    abstract val defaultConverter: (T, String, Any?) -> Either<T>

    fun map(function: Value): BaseMongoIterableHelper<*> {
        return helper(iterable.map { v ->
            converter.toJava(function.execute(converter.toJs(v))).value
        }, converter)
    }

    fun itcount(): Int {
        return iterable.count()
    }

    fun toArray(): List<Any?> = iterable.toList()

    fun batchSize(v: Int): Unit = set("batchSize", v)
    open fun limit(v: Int): Unit = throw NotImplementedError("limit is not supported")
    fun limit(): Int = options["limit"] as? Int ?: -1
    open fun max(v: Document): Unit = throw NotImplementedError("max is not supported")
    open fun min(v: Document): Unit = throw NotImplementedError("min is not supported")
    open fun projection(v: Document): Unit = throw NotImplementedError("projection is not supported")
    open fun skip(v: Int): Unit = throw NotImplementedError("skip is not supported")
    open fun comment(v: String): Unit = throw NotImplementedError("comment is not supported")
    open fun hint(v: String): Unit = throw NotImplementedError("hint is not supported")
    open fun hint(v: Document): Unit = throw NotImplementedError("hint is not supported")
    open fun collation(v: Document): Unit = throw NotImplementedError("collation is not supported")
    open fun allowPartialResults(): Unit = throw NotImplementedError("allowPartialResults is not supported")
    open fun count(): Long = throw NotImplementedError("count is not supported")
    open fun maxTimeMS(v: Long): Unit = throw NotImplementedError("maxTimeMS is not supported")
    open fun noCursorTimeout(): Unit = throw NotImplementedError("noCursorTimeout is not supported")
    open fun oplogReplay(): Unit = throw NotImplementedError("oplogReplay is not supported")
    open fun returnKey(v: Boolean): Unit = throw NotImplementedError("returnKey is not supported")
    open fun sort(spec: Document): Unit = throw NotImplementedError("sort is not supported")
    open fun tailable(): Unit = throw NotImplementedError("tailable is not supported")
    open fun explain(verbosity: String?): Any? = throw NotImplementedError("explain is not supported")
    open fun readPrev(v: String, tags: List<TagSet>?): BaseMongoIterableHelper<*> = throw NotImplementedError("readPrev is not supported")
    open fun readConcern(v: Value): BaseMongoIterableHelper<*> = throw NotImplementedError("readConcern is not supported")

    protected fun set(key: String, value: Any?) {
        options[key] = value
        convert(iterable, converters, defaultConverter, mapOf(key to value))
    }
}

internal class MongoIterableHelper(iterable: MongoIterable<*>,
                                   converter: MongoShellConverter,
                                   options: Document) : BaseMongoIterableHelper<MongoIterable<*>>(iterable, converter, options) {
    override val converters = iterableConverters
    override val defaultConverter = unrecognizedField<MongoIterable<*>>("iterable options")
}

internal data class AggregateCreateOptions(val db: MongoDatabase,
                                           val collection: String?,
                                           val pipeline: List<Document>)

internal class AggregateIterableHelper(iterable: AggregateIterable<*>,
                                       converter: MongoShellConverter,
                                       options: Document,
                                       private val createOptions: AggregateCreateOptions?)
    : BaseMongoIterableHelper<AggregateIterable<out Any?>>(iterable, converter, options) {
    override val converters = aggregateConverters
    override val defaultConverter = aggregateDefaultConverter

    override fun explain(verbosity: String?): Any? {
        check(createOptions != null) { "createOptions were not saved" }
        val explain = Document()
        explain["aggregate"] = createOptions.collection ?: 1
        explain["pipeline"] = createOptions.pipeline
        explain["explain"] = true
        explain.putAll(options)
        return createOptions.db.runCommand(explain)
    }

    override fun readPrev(v: String, tags: List<TagSet>?): AggregateIterableHelper {
        check(createOptions != null) { "createOptions were not saved" }
        val newDb = if (tags == null) createOptions.db.withReadPreference(ReadPreference.valueOf(v))
        else createOptions.db.withReadPreference(ReadPreference.valueOf(v, tags))
        val newCreateOptions = createOptions.copy(db = newDb)
        val newIterable = aggregate(options, newCreateOptions)
        return AggregateIterableHelper(newIterable, converter, options, newCreateOptions)
    }

    override fun readConcern(v: Value): AggregateIterableHelper {
        check(createOptions != null) { "createOptions were not saved" }
        if (!v.hasMembers()) throw IllegalArgumentException("document was expected. Got $v")
        val newDb = readConcernConverter(createOptions.db, (converter.toJava(v) as DocumentResult).value).getOrThrow()
        val newCreateOptions = createOptions.copy(db = newDb)
        val newIterable = aggregate(options, newCreateOptions)
        return AggregateIterableHelper(newIterable, converter, options, newCreateOptions)
    }

    override fun maxTimeMS(v: Long) = set("maxTimeMS", v)
    override fun comment(v: String) = set("comment", v)
    override fun hint(v: Document) = set("hint", v)
    override fun collation(v: Document) = set("collation", v)
}

internal fun find(options: Document, createOptions: FindCreateOptions): FindIterable<Document> {
    val coll = createOptions.collection
    val db = createOptions.db
    val find = createOptions.find
    val iterable = db.getCollection(coll).find(find)
    convert(iterable, findConverters, findDefaultConverter, options).getOrThrow()
    return iterable
}

internal fun aggregate(options: Document, createOptions: AggregateCreateOptions): AggregateIterable<Document> {
    val coll = createOptions.collection
    val db = createOptions.db
    val pipeline = createOptions.pipeline
    val iterable = if (coll == null) db.aggregate(pipeline)
    else db.getCollection(coll).aggregate(pipeline)

    convert(iterable, aggregateConverters, aggregateDefaultConverter, options).getOrThrow()
    return iterable
}

internal data class FindCreateOptions(val db: MongoDatabase,
                                      val collection: String,
                                      val find: Document)

internal class FindIterableHelper(iterable: FindIterable<out Any?>,
                                  converter: MongoShellConverter,
                                  options: Document,
                                  private val createOptions: FindCreateOptions?)
    : BaseMongoIterableHelper<FindIterable<out Any?>>(iterable, converter, options) {
    override val converters = findConverters
    override val defaultConverter = findDefaultConverter

    override fun readPrev(v: String, tags: List<TagSet>?): FindIterableHelper {
        check(createOptions != null) { "createOptions were not saved" }
        val newDb = if (tags == null) createOptions.db.withReadPreference(ReadPreference.valueOf(v))
        else createOptions.db.withReadPreference(ReadPreference.valueOf(v, tags))
        val newCreateOptions = createOptions.copy(db = newDb)
        val newIterable = find(options, newCreateOptions)
        return FindIterableHelper(newIterable, converter, options, newCreateOptions)
    }

    override fun readConcern(v: Value): FindIterableHelper {
        check(createOptions != null) { "createOptions were not saved" }
        if (!v.hasMembers()) throw IllegalArgumentException("document was expected. Got $v")
        val newDb = readConcernConverter(createOptions.db, (converter.toJava(v) as DocumentResult).value).getOrThrow()
        val newCreateOptions = createOptions.copy(db = newDb)
        val newIterable = find(options, newCreateOptions)
        return FindIterableHelper(newIterable, converter, options, newCreateOptions)
    }

    override fun allowPartialResults() = set("allowPartialResults", true)
    override fun oplogReplay() = set("oplogReplay", true)
    override fun noCursorTimeout() = set("noCursorTimeout", true)
    override fun maxTimeMS(v: Long) = set("maxTimeMS", v)
    override fun projection(v: Document) = set("projection", v)
    override fun limit(v: Int) = set("limit", v)
    override fun max(v: Document) = set("max", v)
    override fun min(v: Document) = set("min", v)
    override fun skip(v: Int) = set("skip", v)
    override fun comment(v: String) = set("comment", v)
    override fun hint(v: Document) = set("hint", v)
    override fun hint(v: String) = set("hint", v)
    override fun collation(v: Document) = set("collation", v)
    override fun returnKey(v: Boolean) = set("returnKey", v)
    override fun sort(spec: Document) = set("sort", spec)
    override fun tailable() = set("tailable", CursorType.Tailable.toString())

    override fun count(): Long {
        check(createOptions != null) { "createOptions were not saved" }
        val countOptionsMap = options.filterKeys { countOptionsConverters.containsKey(it) }
        val countOptions = convert(CountOptions(), countOptionsConverters, countOptionsDefaultConverter, countOptionsMap).getOrThrow()
        return createOptions.db.getCollection(createOptions.collection).countDocuments(createOptions.find, countOptions)
    }

    override fun explain(verbosity: String?): Any? {
        check(createOptions != null) { "createOptions were not saved" }
        val findCommand = Document()
        findCommand["find"] = createOptions.collection
        findCommand["filter"] = createOptions.find
        findCommand.putAll(options)
        val explain = Document()
        explain["explain"] = findCommand
        explain["verbosity"] = verbosity ?: "queryPlanner"
        return createOptions.db.runCommand(explain)
    }
}

internal fun helper(iterable: MongoIterable<out Any?>, converter: MongoShellConverter): BaseMongoIterableHelper<*> {
    return when (iterable) {
        is FindIterable -> FindIterableHelper(iterable, converter, Document(), null)
        is AggregateIterable -> AggregateIterableHelper(iterable, converter, Document(), null)
        else -> MongoIterableHelper(iterable, converter, Document())
    }
}