package com.mongodb.mongosh

import org.graalvm.polyglot.Value
import org.intellij.lang.annotations.Language
import java.lang.IllegalArgumentException

/**
 * Mongosh core binds additional info to objects using Object.defineProperty
 * in wrapWithAddSourceToResult (packages/shell-api/src/decorators.ts)
 *
 * Object.defineProperty throws error for non-JS objects so we need a wrapper for them
 */
internal class ValueWrapper(private val context: MongoShellContext) {
    private val valueWrapperClass: Value = context.eval(VALUE_WRAPPER_SCRIPT)

    fun wrap(value: Any?): Value = valueWrapperClass.newInstance(value)
    fun unwrap(value: Value): Value = if (isWrapped(value)) value.getMember("value") else throw IllegalArgumentException()
    fun isWrapped(value: Value) = value.instanceOf(context, valueWrapperClass)
}


@Language("js")
private val VALUE_WRAPPER_SCRIPT = """
    (() => {
        class ValueWrapper {
            constructor(value) {
                this.value = value;
            }
        }
        return ValueWrapper;
    })()""".trimIndent()
