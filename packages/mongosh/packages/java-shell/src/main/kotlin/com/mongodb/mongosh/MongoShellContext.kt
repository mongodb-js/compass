package com.mongodb.mongosh

import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Source
import org.graalvm.polyglot.Value
import org.graalvm.polyglot.proxy.ProxyExecutable
import org.intellij.lang.annotations.Language
import java.lang.IllegalStateException

internal class MongoShellContext {
    private var ctx: Context? = Context.create()
    val bindings: Value = ctx!!.getBindings("js")

    /** Java functions don't have js methods such as apply, bind, call etc.
     * So we need to create a real js function that wraps Java code */
    private val functionProducer = eval("(fun) => function inner() { return fun(...arguments); }")

    fun jsFun(func: (args: Array<Value>) -> Any?): Value = functionProducer.execute(ProxyExecutable { func(it) })

    fun eval(@Language("js") script: String, name: String = "Unnamed"): Value {
        return getCtx().eval(Source.newBuilder("js", script, name).build())
    }

    fun close() {
        getCtx().close(true)
        this.ctx = null
    }

    private fun getCtx(): Context {
        return this.ctx ?: throw IllegalStateException("Context has already been closed")
    }
}
