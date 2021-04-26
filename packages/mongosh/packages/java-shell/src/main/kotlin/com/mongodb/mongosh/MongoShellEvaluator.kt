package com.mongodb.mongosh

import com.mongodb.client.MongoClient
import com.mongodb.mongosh.service.JavaServiceProvider
import org.graalvm.polyglot.Value
import org.graalvm.polyglot.proxy.ProxyExecutable
import org.intellij.lang.annotations.Language
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatterBuilder
import java.time.temporal.ChronoField
import java.time.temporal.TemporalAccessor
import java.time.temporal.TemporalField
import java.time.temporal.UnsupportedTemporalTypeException
import java.util.*

internal class MongoShellEvaluator(client: MongoClient, private val context: MongoShellContext, private val converter: MongoShellConverter, wrapper: ValueWrapper) {
    private val serviceProvider = JavaServiceProvider(client, converter, wrapper)
    private val shellEvaluator: Value
    private val shellInternalState: Value
    private val toShellResultFn: Value
    private val getShellApiTypeFn: Value

    init {
        val setupScript = MongoShell::class.java.getResource("/js/all-standalone.js")!!.readText()
        context.eval(setupScript, "all-standalone.js")
        val global = context.bindings["_global"]!!
        context.bindings.removeMember("_global")
        shellInternalState = global.getMember("ShellInternalState").newInstance(serviceProvider)
        shellEvaluator = global.getMember("ShellEvaluator").newInstance(shellInternalState, resultHandler())
        toShellResultFn = global.getMember("toShellResult")
        getShellApiTypeFn = global.getMember("getShellApiType")
        val jsSymbol = context.bindings["Symbol"]!!
        shellInternalState.invokeMember("setCtx", context.bindings)
        initContext(context.bindings, jsSymbol)
    }

    private fun resultHandler() = context.jsFun { args ->
        if (args.size != 1) {
            throw IllegalArgumentException("Expected one argument. Got ${args.size} ${args.contentToString()}")
        }
        val rawValue = args[0]
        when (val type = getShellApiType(rawValue)) {
            "Cursor", "AggregationCursor" -> shellResult(rawValue, type)
            else -> toShellResult(rawValue)
        }
    }

    private fun initContext(bindings: Value, jsSymbol: Value) {
        bindings["BSONSymbol"] = bindings["Symbol"]
        bindings["Symbol"] = jsSymbol
        val date = context.eval("(dateHelper) => function inner() { return dateHelper(new.target !== undefined, ...arguments) }", "dateHelper_script")
                .execute(ProxyExecutable { args -> dateHelper(args[0].asBoolean(), args.drop(1)) })
        date["now"] = ProxyExecutable { System.currentTimeMillis() }
        bindings["Date"] = date
        bindings["ISODate"] = context.jsFun { args -> dateHelper(true, args.toList()) }
        bindings["UUID"] = context.jsFun { args -> if (args.isEmpty()) UUID.randomUUID() else UUID.fromString(args[0].asString()) }
    }

    private fun shellResult(printable: Value, type: String): Value {
        return context.eval("(printable, type) => ({printable: printable, type: type})")
                .execute(printable, type)
    }

    private fun dateHelper(createObject: Boolean, args: List<Value>): Any {
        val date = when {
            args.isEmpty() -> MongoshDate(System.currentTimeMillis())
            args.size == 1 -> {
                when (val v = converter.toJava(args[0]).value) {
                    is String -> parseDate(v)
                    is Number -> MongoshDate(v.toLong())
                    else -> throw IllegalArgumentException("Expected number or string. Got: ${args[0]} ($v)")
                }
            }
            else -> {
                if (args.any { !it.fitsInInt() }) throw IllegalArgumentException("Expected list of numbers. Got: ${args}")
                else {
                    val localDateTime = LocalDateTime.of(args[0].asInt(), args.getOrNull(1)?.asInt() ?: 1,
                            args.getOrNull(2)?.asInt() ?: 1, args.getOrNull(3)?.asInt() ?: 0,
                            args.getOrNull(4)?.asInt() ?: 0, args.getOrNull(5)?.asInt() ?: 0,
                            args.getOrNull(6)?.asInt() ?: 0)
                    MongoshDate(localDateTime.atZone(ZoneOffset.UTC).toInstant().toEpochMilli())
                }
            }
        }
        return if (createObject) date else date.toString()
    }

    private fun parseDate(str: String): Date {
        val accessor = DATE_FORMATTER.parse(str)
        val dateTime = OffsetDateTime.of(
                accessor.safeGet(ChronoField.YEAR) ?: 0,
                accessor.safeGet(ChronoField.MONTH_OF_YEAR) ?: 1,
                accessor.safeGet(ChronoField.DAY_OF_MONTH) ?: 1,
                accessor.safeGet(ChronoField.HOUR_OF_DAY) ?: 0,
                accessor.safeGet(ChronoField.MINUTE_OF_HOUR) ?: 0,
                accessor.safeGet(ChronoField.SECOND_OF_MINUTE) ?: 0,
                accessor.safeGet(ChronoField.NANO_OF_SECOND) ?: 0,
                ZoneOffset.ofTotalSeconds(accessor.safeGet(ChronoField.OFFSET_SECONDS) ?: 0))
        return MongoshDate(dateTime.toInstant().toEpochMilli())
    }

    private fun TemporalAccessor.safeGet(field: TemporalField): Int? {
        try {
            return this[field]
        } catch (ignored: UnsupportedTemporalTypeException) {
        }
        return null
    }

    fun getShellApiType(rawValue: Value): String? {
        val rawType = getShellApiTypeFn.execute(rawValue)
        return if (rawType.isString) rawType.asString() else null
    }

    fun toShellResult(rawValue: Value): Value {
        return converter.unwrapPromise(toShellResultFn.execute(rawValue))
    }

    fun eval(@Language("js") script: String, name: String): Value {
        updateDatabase()
        val originalEval = ProxyExecutable { args ->
            context.eval(args[0].asString(), name)
        }
        return shellEvaluator.invokeMember("customEval", originalEval, script)
    }

    private fun updateDatabase() {
        // graaljs does not allow to define property on top context, so we need to update internal state manually
        val currentDb = context.eval("db")
        val currentDbName = currentDb.invokeMember("getName").asString()
        val stateDbName = shellInternalState["currentDb"]?.invokeMember("getName")?.asString()
        if (currentDbName != stateDbName) {
            shellInternalState.invokeMember("setDbFunc", currentDb)
        }
    }

    fun close() {
        context.close()
    }
}

private val COLON = DateTimeFormatterBuilder().appendLiteral(":").toFormatter()
private val HYPHEN = DateTimeFormatterBuilder().appendLiteral("-").toFormatter()

/**
 * yyyy-MM-dd['T'HH:mm:ss.SSS['Z'|+HH:MM:ss]]
 */
private val DATE_FORMATTER = DateTimeFormatterBuilder()
        .appendValue(ChronoField.YEAR, 4)
        .appendOptional(HYPHEN)
        .appendValue(ChronoField.MONTH_OF_YEAR, 2)
        .appendOptional(HYPHEN)
        .appendValue(ChronoField.DAY_OF_MONTH, 2)
        .optionalStart()
        .appendLiteral('T')
        .appendValue(ChronoField.HOUR_OF_DAY, 2)
        .appendOptional(COLON)
        .appendValue(ChronoField.MINUTE_OF_HOUR, 2)
        .optionalStart()
        .appendOptional(COLON)
        .appendValue(ChronoField.SECOND_OF_MINUTE, 2)
        .optionalStart()
        .appendFraction(ChronoField.NANO_OF_SECOND, 0, 9, true)
        .appendOffset("+HH:MM:ss", "Z")
        .toFormatter()
