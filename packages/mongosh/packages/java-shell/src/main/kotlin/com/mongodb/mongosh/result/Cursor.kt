package com.mongodb.mongosh.result

import com.mongodb.mongosh.MongoShellConverter
import org.graalvm.polyglot.Value

open class Cursor<out T> internal constructor(protected var cursor: Value?, private var converter: MongoShellConverter?) : Iterator<T> {
    private var currentIterationResult: List<T>? = null

    fun _asPrintable(): String = ArrayResult(currentIterationResult ?: it())._asPrintable()

    private fun it(): List<T> {
        val currentIterationResult = mutableListOf<T>()
        for (i in 0 until 20) {
            if (!hasNext()) break
            currentIterationResult.add(next())
        }
        this.currentIterationResult = currentIterationResult
        return currentIterationResult
    }

    override fun hasNext(): Boolean {
        val (cursor, converter) = checkClosed()
        return converter.unwrapPromise(cursor.invokeMember("hasNext")).asBoolean()
    }

    override fun next(): T {
        val (cursor, converter) = checkClosed()
        if (!hasNext()) throw NoSuchElementException()
        return converter.toJava(converter.unwrapPromise(cursor.invokeMember("next"))).value as T
    }

    fun tryNext(): T {
        val (cursor, converter) = checkClosed()
        return converter.toJava(converter.unwrapPromise(cursor.invokeMember("tryNext"))).value as T
    }

    fun close() {
        val (c, _) = checkClosed()
        c.invokeMember("close")
        cursor = null
        converter = null
    }

    internal fun checkClosed(): Pair<Value, MongoShellConverter> {
        val cursor = this.cursor
        val converter = this.converter
        if (cursor == null || converter == null) throw IllegalStateException("Cursor has already been closed")
        return cursor to converter
    }
}
