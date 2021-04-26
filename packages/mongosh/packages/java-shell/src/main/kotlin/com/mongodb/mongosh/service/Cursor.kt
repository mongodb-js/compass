package com.mongodb.mongosh.service

import com.mongodb.client.MongoCursor
import com.mongodb.mongosh.MongoShellConverter
import com.mongodb.mongosh.ValueWrapper
import com.mongodb.mongosh.result.DocumentResult
import org.bson.Document
import org.graalvm.polyglot.HostAccess
import org.graalvm.polyglot.Value

internal class Cursor(private var helper: BaseMongoIterableHelper<*>, private val converter: MongoShellConverter, private val wrapper: ValueWrapper) : ServiceProviderCursor {
    private var iterator: MongoCursor<out Any?>? = null

    @JvmField
    @HostAccess.Export
    var closed = false

    private fun getOrCreateIterator(): MongoCursor<out Any?> {
        var it = iterator
        if (it == null) {
            it = helper.iterable.iterator()
            iterator = it
        }
        return it
    }

    @HostAccess.Export
    override fun addCursorFlag(flag: String, v: Boolean): Cursor {
        checkQueryNotExecuted()
        when (flag) {
            "noCursorTimeout" -> helper.noCursorTimeout()
            "partial" -> helper.allowPartialResults()
            "oplogReplay" -> helper.oplogReplay()
            "tailable" -> helper.tailable()
            "slaveOk",
            "awaitData",
            "exhaust" -> throw NotImplementedError("Cursor flag $flag is not supported")
            else -> throw IllegalArgumentException("Unknown cursor flag $flag")
        }
        return this
    }

    @HostAccess.Export
    override fun addOption(option: Int): Cursor {
        throw NotImplementedError("addOption is not supported") // not supported in driver
    }

    @HostAccess.Export
    override fun batchSize(v: Int): Cursor {
        checkQueryNotExecuted()
        helper.batchSize(v)
        return this
    }

    /**
     * cursor.objsLeftInBatch()
     */
    override fun bufferedCount(): Int {
        throw NotImplementedError("bufferedCount is not supported")
    }

    @HostAccess.Export
    override fun close() {
        closed = true
        iterator?.close()
    }

    @HostAccess.Export
    override fun close(options: Value) = close()

    override fun clone(): Cursor {
        checkQueryNotExecuted()
        throw NotImplementedError("clone is not supported") // not supported in driver
    }

    @HostAccess.Export
    override fun collation(v: Value): Cursor {
        checkQueryNotExecuted()
        if (!v.hasMembers()) {
            throw IllegalArgumentException("Expected one argument of type object. Got: $v")
        }
        val collation = toDocument(converter, v)
        helper.collation(collation)
        return this
    }

    @HostAccess.Export
    override fun comment(v: String): Cursor {
        checkQueryNotExecuted()
        helper.comment(v)
        return this
    }

    @HostAccess.Export
    override fun count(): Long {
        checkQueryNotExecuted()
        return helper.count()
    }

    @HostAccess.Export
    override fun explain(verbosity: String?): Any? {
        checkQueryNotExecuted()
        return converter.toJs(helper.explain(verbosity))
    }

    @HostAccess.Export
    override fun forEach(func: Value) {
        if (!func.canExecute()) {
            throw IllegalArgumentException("Expected one argument of type function. Got: $func")
        }
        getOrCreateIterator().forEach { v ->
            func.execute(converter.toJs(v))
        }
    }

    @HostAccess.Export
    override fun hasNext(): Boolean = getOrCreateIterator().hasNext()

    @HostAccess.Export
    override fun hint(v: Value): Cursor {
        checkQueryNotExecuted()
        if (!(v.hasMembers() || v.isString)) {
            throw IllegalArgumentException("Expected one argument of type string or object. Got: $v")
        }
        if (v.isString) {
            helper.hint(v.asString())
        } else if (v.hasMembers()) {
            helper.hint(toDocument(converter, v))
        }
        return this
    }

    @HostAccess.Export
    override fun isExhausted(): Boolean {
        return closed && !hasNext()
    }

    @HostAccess.Export
    override fun itcount(): Int {
        checkQueryNotExecuted()
        return helper.itcount()
    }

    @HostAccess.Export
    override fun limit(v: Int): Cursor {
        checkQueryNotExecuted()
        helper.limit(v)
        return this
    }

    @HostAccess.Export
    override fun map(func: Value): Cursor {
        checkQueryNotExecuted()
        if (!func.canExecute()) {
            throw IllegalArgumentException("Expected one argument of type function. Got: $func")
        }
        helper = helper.map(func)
        return this
    }

    @HostAccess.Export
    override fun max(v: Value): Cursor {
        checkQueryNotExecuted()
        if (!v.hasMembers()) {
            throw IllegalArgumentException("Expected one argument of type object. Got: $v")
        }
        helper.max(toDocument(converter, v))
        return this
    }

    @HostAccess.Export
    override fun maxTimeMS(v: Long): Cursor {
        checkQueryNotExecuted()
        helper.maxTimeMS(v)
        return this
    }

    override fun maxAwaitTimeMS(value: Int): ServiceProviderCursor {
        throw NotImplementedError("maxAwaitTimeMS is not supported")
    }

    @HostAccess.Export
    override fun min(v: Value): ServiceProviderCursor {
        checkQueryNotExecuted()
        if (!v.hasMembers()) {
            throw IllegalArgumentException("Expected one argument of type object. Got: $v")
        }
        helper.min(toDocument(converter, v))
        return this
    }

    @HostAccess.Export
    override fun next(): Any? {
        /* findOne returns single document as a result.
         * Mongosh core will try to defineProperty on it and fail if value is not wrapped in JS object */
        val shouldWrap = iterator == null && helper.limit() == 1
        val value = getOrCreateIterator().next()
        return if (shouldWrap) wrapper.wrap(value) // it's possibly a findOne call
        else value
    }

    @HostAccess.Export
    override fun tryNext(): Any? {
        /* findOne returns single document as a result.
         * Mongosh core will try to defineProperty on it and fail if value is not wrapped in JS object */
        val shouldWrap = iterator == null && helper.limit() == 1
        val value = getOrCreateIterator().tryNext()
        return if (shouldWrap) wrapper.wrap(value) // it's possibly a findOne call
        else value
    }

    @HostAccess.Export
    override fun project(v: Value): ServiceProviderCursor {
        checkQueryNotExecuted()
        helper.projection(toDocument(converter, v))
        return this
    }

    @HostAccess.Export
    override fun returnKey(v: Value): Cursor {
        checkQueryNotExecuted()
        helper.returnKey(if (v.isBoolean) v.asBoolean() else true)
        return this
    }

    @HostAccess.Export
    override fun withReadPreference(v: String): Cursor {
        checkQueryNotExecuted()
        helper = helper.readPrev(v, null)
        return this
    }

    @HostAccess.Export
    override fun withReadConcern(v: Value): Cursor {
        checkQueryNotExecuted()
        helper = helper.readConcern(v)
        return this
    }

    override fun showRecordId(v: Boolean): ServiceProviderCursor {
        throw NotImplementedError("showRecordId is not supported")
    }

    @HostAccess.Export
    override fun size(): Value {
        throw NotImplementedError("size is not supported")
    }

    @HostAccess.Export
    override fun skip(v: Int): Cursor {
        checkQueryNotExecuted()
        helper.skip(v)
        return this
    }

    @HostAccess.Export
    override fun sort(spec: Value): Cursor {
        checkQueryNotExecuted()
        helper.sort(toDocument(converter, spec))
        return this
    }

    @HostAccess.Export
    override fun toArray(): Any? {
        checkQueryNotExecuted()
        return converter.toJs(helper.toArray())
    }

    private fun checkQueryNotExecuted() {
        check(iterator == null) { "query already executed" }
    }

    private fun toDocument(converter: MongoShellConverter, map: Value?): Document {
        return if (map == null || map.isNull) Document()
        else (converter.toJava(map) as DocumentResult).value
    }
}
