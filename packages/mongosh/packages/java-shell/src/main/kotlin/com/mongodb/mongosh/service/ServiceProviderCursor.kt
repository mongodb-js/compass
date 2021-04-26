package com.mongodb.mongosh.service

import org.graalvm.polyglot.Value

interface ServiceProviderCursor {
  fun addCursorFlag(flag: String, v: Boolean): ServiceProviderCursor
  fun addOption(option: Int): ServiceProviderCursor
  fun batchSize(v: Int): ServiceProviderCursor
  fun bufferedCount(): Int
  fun close(options: Value)
  fun close()
  fun clone(): ServiceProviderCursor
  fun collation(v: Value): ServiceProviderCursor
  fun comment(v: String): ServiceProviderCursor
  fun count(): Long
  fun forEach(func: Value)
  fun hasNext(): Boolean
  fun hint(v: Value): ServiceProviderCursor
  fun isExhausted(): Boolean
  fun itcount(): Int
  fun limit(v: Int): ServiceProviderCursor
  fun map(func: Value): ServiceProviderCursor
  fun max(v: Value): ServiceProviderCursor
  fun maxTimeMS(v: Long): ServiceProviderCursor
  fun maxAwaitTimeMS(value: Int): ServiceProviderCursor
  fun min(v: Value): ServiceProviderCursor
  fun tryNext(): Any?
  fun next(): Any?
  fun project(v: Value): ServiceProviderCursor
  fun returnKey(v: Value): ServiceProviderCursor
  fun withReadPreference(v: String): ServiceProviderCursor
  fun withReadConcern(v: Value): ServiceProviderCursor
  fun showRecordId(v: Boolean): ServiceProviderCursor
  fun size(): Value
  fun skip(v: Int): ServiceProviderCursor
  fun sort(spec: Value): ServiceProviderCursor
  fun toArray(): Any?
  fun explain(verbosity: String?): Any?
}
