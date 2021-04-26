package com.mongodb.mongosh

import com.mongodb.DBRef
import com.mongodb.client.result.UpdateResult
import com.mongodb.mongosh.result.*
import com.mongodb.mongosh.service.Either
import com.mongodb.mongosh.service.Left
import com.mongodb.mongosh.service.Right
import org.bson.Document
import org.bson.json.JsonReader
import org.bson.types.*
import org.graalvm.polyglot.Value
import org.graalvm.polyglot.proxy.ProxyExecutable
import java.util.*
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern

internal class MongoShellConverter(private val context: MongoShellContext, private val wrapper: ValueWrapper) {
    private val bsonTypes = BsonTypes(context)

    fun toJs(o: Any?): Any? {
        return when (o) {
            is Iterable<*> -> toJs(o)
            is Array<*> -> toJs(o)
            is Map<*, *> -> toJs(o)
            Unit -> context.eval("undefined")
            else -> o
        }
    }

    private fun toJs(map: Map<*, *>): Value {
        @Suppress("JSPrimitiveTypeWrapperUsage")
        val jsMap = context.eval("new Object()")
        for ((key, value) in map.entries) {
            jsMap[key as String] = toJs(value)
        }
        return jsMap
    }

    private fun toJs(list: Iterable<Any?>): Value {
        val array = context.eval("[]")
        list.forEachIndexed { index, v ->
            array.setArrayElement(index.toLong(), toJs(v))
        }
        return array
    }

    private fun toJs(list: Array<*>): Value {
        val array = context.eval("[]")
        list.forEachIndexed { index, v ->
            array.setArrayElement(index.toLong(), toJs(v))
        }
        return array
    }

    fun <T> toJsPromise(promise: Either<T>): Value {
        return when (promise) {
            is Right -> context.eval("(v) => new Promise(((resolve) => resolve(v)))", "resolved_promise_script").execute(toJs(promise.value))
            is Left -> context.eval("(v) => new Promise(((_, reject) => reject(v)))", "rejected_promise_script").execute(promise.value)
        }
    }

    fun toJavaPromise(v: Value): CompletableFuture<Value> {
        return if (v.instanceOf(context, "Promise"))
            CompletableFuture<Value>().also { future ->
                v.invokeMember("then", ProxyExecutable { args ->
                    future.complete(args[0])
                }).invokeMember("catch", ProxyExecutable { args ->
                    val error = args[0]
                    if (error.isHostObject && error.asHostObject<Any>() is Throwable) {
                        future.completeExceptionally(error.asHostObject<Any>() as Throwable)
                    } else {
                        val message = error.toString() + (if (error.instanceOf(context, "Error")) "\n${error.getMember("stack").asString()}" else "")
                        future.completeExceptionally(Exception(message))
                    }
                })
            }
        else CompletableFuture.completedFuture(v)
    }

    fun unwrapPromise(v: Value): Value {
        try {
            return toJavaPromise(v).get(1, TimeUnit.SECONDS)
        } catch (e: ExecutionException) {
            throw e.cause ?: e
        }
    }

    fun toJava(v: Value, type: String? = null): MongoShellResult<*> {
        return when {
            wrapper.isWrapped(v) -> toJava(wrapper.unwrap(v), type)
            type == "Help" -> toJava(v["attr"]!!)
            type == "Cursor" -> FindCursorResult(FindCursor<Any?>(v, this))
            // document with aggregation explain result also has type AggregationCursor, so we need to make sure that value contains cursor
            type == "AggregationCursor" && v.hasMember("_cursor") -> CursorResult(Cursor<Any?>(v, this))
            type == "InsertOneResult" -> InsertOneResult(v["acknowledged"]!!.asBoolean(), v["insertedId"]!!.asString())
            type == "DeleteResult" -> DeleteResult(v["acknowledged"]!!.asBoolean(), v["deletedCount"]!!.asLong())
            type == "UpdateResult" -> {
                val res = if (v["acknowledged"]!!.asBoolean()) {
                    UpdateResult.acknowledged(
                            v["matchedCount"]!!.asLong(),
                            v["modifiedCount"]!!.asLong(),
                            null
                    )
                } else UpdateResult.unacknowledged()
                MongoShellUpdateResult(res)
            }
            type == "BulkWriteResult" -> BulkWriteResult(
                    v["acknowledged"]!!.asBoolean(),
                    v["insertedCount"]!!.asLong(),
                    v["matchedCount"]!!.asLong(),
                    v["modifiedCount"]!!.asLong(),
                    v["deletedCount"]!!.asLong(),
                    v["upsertedCount"]!!.asLong(),
                    (toJava(v["upsertedIds"]!!) as ArrayResult).value)
            type == "InsertManyResult" -> InsertManyResult(v["acknowledged"]!!.asBoolean(), toJava(v["insertedIds"]!!).value as List<String>)
            v.instanceOf(context, "RegExp") -> {
                val pattern = v["source"]!!.asString()
                val flags1 = v["flags"]!!.asString()
                var f = 0
                if (flags1.contains('m')) f = f.or(Pattern.MULTILINE)
                if (flags1.contains('i')) f = f.or(Pattern.CASE_INSENSITIVE)
                PatternResult(Pattern.compile(pattern, f))
            }
            v.instanceOf(context, bsonTypes.maxKey) -> MaxKeyResult()
            v.instanceOf(context, bsonTypes.minKey) -> MinKeyResult()
            v.instanceOf(context, bsonTypes.objectId) -> ObjectIdResult(JsonReader(v.invokeMember("toExtendedJSON").toString()).readObjectId())
            v.instanceOf(context, bsonTypes.numberDecimal) -> Decimal128Result(JsonReader(v.invokeMember("toExtendedJSON").toString()).readDecimal128())
            v.instanceOf(context, bsonTypes.numberInt) -> IntResult(JsonReader(v.invokeMember("toExtendedJSON").toString()).readInt32())
            v.instanceOf(context, bsonTypes.bsonSymbol) -> SymbolResult(Symbol(JsonReader(v.invokeMember("toExtendedJSON").toString()).readSymbol()))
            v.instanceOf(context, bsonTypes.timestamp) -> {
                val timestamp = JsonReader(toJava(v.invokeMember("toExtendedJSON")).value.toLiteral()).readTimestamp()
                BSONTimestampResult(BSONTimestamp(timestamp.time, timestamp.inc))
            }
            v.instanceOf(context, bsonTypes.code) -> {
                val scope = toJava(v["scope"]!!).value as? Document
                val code = v["code"]!!.asString()
                if (scope == null) CodeResult(Code(code))
                else CodeWithScopeResult(CodeWithScope(code, scope))
            }
            v.instanceOf(context, bsonTypes.dbRef) -> {
                val databaseName = v["db"]?.let { if (it.isNull) null else it }?.asString()
                val collectionName = v["collection"]!!.asString()
                val value = toJava(v["oid"]!!).value
                DBRefResult(DBRef(databaseName, collectionName, value))
            }
            v.instanceOf(context, bsonTypes.numberLong) -> LongResult(JsonReader(v.invokeMember("toExtendedJSON").toString()).readInt64())
            v.instanceOf(context, bsonTypes.binData) -> {
                val binary = JsonReader(v.invokeMember("toExtendedJSON").toString()).readBinaryData()
                BinaryResult(Binary(binary.type, binary.data))
            }
            v.instanceOf(context, bsonTypes.hexData) -> {
                val binary = JsonReader(v.invokeMember("toExtendedJSON").toString()).readBinaryData()
                BinaryResult(Binary(binary.type, binary.data))
            }
            v.isString -> StringResult(v.asString())
            v.isBoolean -> BooleanResult(v.asBoolean())
            v.fitsInInt() -> IntResult(v.asInt())
            v.fitsInLong() -> LongResult(v.asLong())
            v.fitsInFloat() -> FloatResult(v.asFloat())
            v.fitsInDouble() -> DoubleResult(v.asDouble())
            v.equalsTo(context, "undefined") -> VoidResult
            v.isNull -> NullResult
            v.isHostObject && v.asHostObject<Any?>() is Unit -> VoidResult
            v.isHostObject && v.asHostObject<Any?>() is Document -> DocumentResult(v.asHostObject())
            v.isHostObject && v.asHostObject<Any?>() is ObjectId -> ObjectIdResult(v.asHostObject())
            v.isHostObject && v.asHostObject<Any?>() is UUID -> UUIDResult(v.asHostObject())
            v.isHostObject && v.asHostObject<Any?>() is Date -> DateResult(v.asHostObject())
            v.hasArrayElements() -> ArrayResult((0 until v.arraySize).map { toJava(v.getArrayElement(it)).value })
            v.canExecute() -> FunctionResult
            v.hasMembers() -> DocumentResult(Document(v.memberKeys.associateWith { key -> toJava(v[key]!!).value })) // todo: handle recursion
            else -> throw IllegalArgumentException("unknown result: $v")
        }
    }
}

private class BsonTypes(context: MongoShellContext) {
    val maxKey: Value        by lazy { context.eval("new MaxKey().constructor") }
    val minKey: Value        by lazy { context.eval("new MinKey().constructor") }
    val objectId: Value      by lazy { context.eval("new ObjectId().constructor") }
    val numberDecimal: Value by lazy { context.eval("new NumberDecimal().constructor") }
    val numberInt: Value     by lazy { context.eval("new NumberInt().constructor") }
    val timestamp: Value     by lazy { context.eval("new Timestamp().constructor") }
    val code: Value          by lazy { context.eval("new Code().constructor") }
    val dbRef: Value         by lazy { context.eval("new DBRef('', '', '').constructor") }
    val bsonSymbol: Value    by lazy { context.eval("new BSONSymbol('').constructor") }
    val numberLong: Value    by lazy { context.eval("new NumberLong().constructor") }
    val binData: Value       by lazy { context.eval("new BinData(0, '').constructor") }
    val hexData: Value       by lazy { context.eval("new HexData(0, '').constructor") }
}
