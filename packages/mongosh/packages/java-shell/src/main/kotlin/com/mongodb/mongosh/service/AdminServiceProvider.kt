package com.mongodb.mongosh.service

import org.graalvm.polyglot.Value

/**
 * see service-provider-core/src/admin.ts
 */
internal interface AdminServiceProvider {
    fun listDatabases(database: String, options: Value?): Value
    fun readPreferenceFromOptions(options: Value?): Value
    fun getNewConnection(uri: String, options: Value?): Value
    fun getConnectionInfo(): Value
    fun authenticate(authDoc: Value): Value
    fun createCollection(database: String, collection: String, options: Value?): Value
    fun getReadPreference(): Value
    fun getReadConcern(): Value
    fun getWriteConcern(): Value
    fun resetConnectionOptions(): Value
}
