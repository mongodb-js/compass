package com.mongodb.mongosh.cli

import com.mongodb.ConnectionString
import com.mongodb.MongoClientSettings
import com.mongodb.client.MongoClients
import com.mongodb.mongosh.MongoShell
import java.util.*
import kotlin.system.exitProcess

fun main(vararg args: String) {
    if (args.isEmpty()) {
        System.err.println("Please specify MongoDB URI connection string as program argument")
        exitProcess(1)
    }

    val url = args[0]
    println("Connecting to: $url")

    val settings = MongoClientSettings.builder()
            .applyConnectionString(ConnectionString(url))
            .build()

    val repl = MongoShell(MongoClients.create(settings))

    val scanner = Scanner(System.`in`)
    while (true) {
        print("> ")
        val line = scanner.nextLine()
        if (line == null || line == "exit") return
        try {
            val result = repl.eval(line)
            println(result._asPrintable())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
