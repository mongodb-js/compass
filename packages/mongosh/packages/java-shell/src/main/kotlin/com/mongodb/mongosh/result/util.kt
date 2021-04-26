package com.mongodb.mongosh.result

import org.apache.commons.text.StringEscapeUtils
import org.bson.BsonBinary
import org.bson.BsonTimestamp
import org.bson.BsonUndefined
import org.bson.json.JsonMode
import org.bson.json.JsonWriter
import org.bson.json.JsonWriterSettings
import org.bson.types.*
import java.io.StringWriter
import java.util.*


internal fun String.quote(): String {
    return "\"" + StringEscapeUtils.escapeJava(this) + "\""
}

internal fun Any?.toLiteral(): String = when (this) {
    null             -> "null"
    is Map<*, *>     -> this.toLiteral()
    is Collection<*> -> this.toLiteral()
    is String        -> this.quote()
    is BSONTimestamp -> "{\"\$timestamp\": {\"t\": ${this.time}, \"i\": ${this.inc}}}"
    is BsonUndefined -> json { it.writeUndefined() }
    is Decimal128    -> "{\"\$numberDecimal\": \"$this\"}"
    is Code          -> "{\"\$code\": \"${this.code}\"}"
    is Binary        -> json { it.writeBinaryData(BsonBinary(this.type, this.data)) }
    is Date          -> json { it.writeDateTime(this.time) }
    is CodeWithScope -> json { it.writeJavaScriptWithScope(this.code) }
    is MinKey        -> "{\"\$minKey\": 1}"
    is MaxKey        -> "{\"\$maxKey\": 1}"
    else             -> toString()
}

private fun json(w: (JsonWriter) -> Unit): String {
    return JsonWriter(StringWriter(), JsonWriterSettings.builder().outputMode(JsonMode.EXTENDED).build()).also { w(it) }.writer.toString()
}

internal fun Collection<*>.toLiteral(): String = when {
    isEmpty() -> "[ ]"
    else -> joinToString(prefix = "[ ", postfix = " ]") { it.toLiteral() }
}

internal fun Map<*, *>.toLiteral(): String = when {
    isEmpty() -> "{ }"
    else -> entries.joinToString(prefix = "{ ", postfix = " }") { (key, v) ->
        val value = v.toLiteral()
        "${key.toString().quote()}: $value"
    }
}
