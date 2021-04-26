@file:Suppress("NOTHING_TO_INLINE")

package com.mongodb.mongosh

import org.graalvm.polyglot.Value
import org.intellij.lang.annotations.Language


internal inline operator fun Value.get(identifier: String): Value? = getMember(identifier)
internal inline operator fun Value.set(identifier: String, value: Any?) = putMember(identifier, value)

internal inline fun Value.instanceOf(context: MongoShellContext, @Language("js") clazz: String): Boolean {
    return context.eval("(x) => x instanceof $clazz", "instance_of_script").execute(this).asBoolean()
}

internal inline fun Value.instanceOf(context: MongoShellContext, clazz: Value?): Boolean {
    return clazz != null && context.eval("(o, clazz) => o instanceof clazz", "instance_of_class_script").execute(this, clazz).asBoolean()
}

internal inline fun Value.equalsTo(context: MongoShellContext, value: String): Boolean {
    return context.eval("(x) => x === $value", "equals_script").execute(this).asBoolean()
}
