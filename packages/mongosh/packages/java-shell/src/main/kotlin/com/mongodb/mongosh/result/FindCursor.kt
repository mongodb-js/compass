package com.mongodb.mongosh.result

import com.mongodb.mongosh.MongoShellConverter
import org.graalvm.polyglot.Value

class FindCursor<out T> internal constructor(cursor: Value?, converter: MongoShellConverter) : Cursor<T>(cursor, converter) {
    fun batchSize(size: Int) {
        val (cursor, _) = checkClosed()
        cursor.invokeMember("batchSize", size)
    }
}
