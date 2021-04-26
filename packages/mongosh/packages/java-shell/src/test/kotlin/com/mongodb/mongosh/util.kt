package com.mongodb.mongosh

import com.mongodb.ConnectionString
import com.mongodb.MongoClientSettings
import com.mongodb.client.MongoClients
import com.mongodb.mongosh.result.*
import org.bson.Document
import org.bson.UuidRepresentation
import org.junit.Assert.*
import org.junit.Assume.assumeFalse
import java.io.File
import java.io.IOException
import java.net.URI
import java.util.regex.Pattern

private const val pathToUri = "src/test/resources/URI.txt"
internal const val DB = "admin"

fun createMongoRepl(): MongoShell {
    val uri = readUri()
    if (uri.isBlank()) {
        fail("Specify MongoDB connection URI in $pathToUri or the JAVA_SHELL_MONGOSH_TEST_URI environment variable")
    }

    val settings = MongoClientSettings.builder()
            .applyConnectionString(ConnectionString(uri))
            .uuidRepresentation(UuidRepresentation.STANDARD)
            .build()

    return MongoShell(MongoClients.create(settings))
}

private fun readUri() = System.getenv("JAVA_SHELL_MONGOSH_TEST_URI") ?: File(pathToUri).readText()
private fun getHostPort(uri: String): String = URI(uri).let { "${it.host}:${it.port}" }

fun doTest(testName: String, shell: MongoShell, testDataPath: String, db: String? = null) {
    // Some tests start with a lowercase variant of testName, some don't
    // (e.g. for BSON types like ISODate, we don't use iSODate.).
    var name = testName[0].toLowerCase() + testName.substring(1)
    if (!File("$testDataPath/$name.js").exists() && !File("$testDataPath/$name-ignored.js").exists()) {
        name = testName
    }
    assumeFalse(File("$testDataPath/$name-ignored.js").exists())
    val test: String = File("$testDataPath/$name.js").readText()
    var before: String? = null
    val commands = mutableListOf<Command>()
    var clear: String? = null
    read(test, listOf(
            SectionHandler("before") { value, _ -> before = value },
            SectionHandler("command") { value, properties ->
                val checkResultClass = properties.any { (key, _) -> key == "checkResultClass" }
                val dontReplaceId = properties.any { (key, _) -> key == "dontReplaceId" }
                val dontCheckValue = properties.any { (key, _) -> key == "dontCheckValue" }
                val options = CompareOptions(checkResultClass, dontCheckValue, dontReplaceId, properties.mapNotNull { (key, value) ->
                    when (key) {
                        "getArrayItem" -> GetArrayItemCommand(value.toInt())
                        "extractProperty" -> ExtractPropertyCommand(value)
                        "containsProperty" -> ContainsPropertyCommand(value)
                        else -> null
                    }
                })
                commands.add(Command(value, options))
            },
            SectionHandler("clear") { value, _ -> clear = value }
    ))

    assertFalse("No command found", commands.isEmpty())

    withDb(shell, db) {
        before?.let { shell.eval(it) }
        try {
            val sb = StringBuilder()
            commands.forEach { cmd ->
                if (sb.isNotEmpty()) sb.append("\n")
                try {
                    val result = shell.eval(cmd.command)
                    if (result is CursorResult) {
                        (result.value as Cursor<*>).hasNext() // test that value is iterable
                    }
                    if (result is VoidResult) return@forEach
                    val actualValue = getActualValue(result, cmd.options)
                    if (result is CursorResult) {
                        (result.value as Cursor<*>).close() // test close
                    }
                    val normalized = if (cmd.options.dontReplaceId) actualValue.trim() else normalize(actualValue)
                    sb.append(normalized)
                } catch (e: Throwable) {
                    System.err.println("IGNORED:")
                    e.printStackTrace()
                    val message = e.message
                    val msg = if (message != null && message.contains('\n')) message.substring(0, message.indexOf('\n')) else message
                    sb.append(e.javaClass.name).append(": ").append(msg?.trim())
                }
            }
            compare(testDataPath, name, sb.toString())
        } finally {
            clear?.let { shell.eval(it) }
        }
    }
}

private fun getActualValue(result: MongoShellResult<*>, options: CompareOptions): String {
    if (options.dontCheckValue) return result.javaClass.simpleName
    val sb = StringBuilder()
    if (options.checkResultClass) sb.append(result.javaClass.simpleName).append(": ")
    if (options.commands.isEmpty()) {
        sb.append(result._asPrintable())
        return sb.toString()
    }
    var unwrapped = result.value
    for (command in options.commands) {
        unwrapped = when (command) {
            is GetArrayItemCommand -> {
                assertTrue("To extract array item result must be an instance of List. Actual: ${unwrapped?.javaClass}", unwrapped is List<*>)
                (unwrapped as List<*>)[command.index]
            }
            is ExtractPropertyCommand -> {
                assertTrue("To extract property result must be an instance of ${Document::class.java}. Actual: ${unwrapped?.javaClass}", unwrapped is Document)
                val property = if (unwrapped is Document) unwrapped[command.property]
                else throw AssertionError()
                assertNotNull("Result does not contain property ${command.property}. Result: ${unwrapped.toLiteral()}", property)
                property
            }
            is ContainsPropertyCommand -> {
                assertTrue("To check property result must be an instance of ${Document::class.java}. Actual: ${unwrapped?.javaClass}", unwrapped is Document)
                if (unwrapped is Document) unwrapped.containsKey(command.property)
                else throw AssertionError()
            }
        }
    }
    sb.append(unwrapped.toLiteral())
    return sb.toString()
}

private class Command(val command: String, val options: CompareOptions)
private class CompareOptions(val checkResultClass: Boolean, val dontCheckValue: Boolean, val dontReplaceId: Boolean, val commands: List<CompareCommand>)
private sealed class CompareCommand
private class GetArrayItemCommand(val index: Int) : CompareCommand()
private class ExtractPropertyCommand(val property: String) : CompareCommand()
private class ContainsPropertyCommand(val property: String) : CompareCommand()

private fun withDb(shell: MongoShell, name: String?, block: () -> Unit) {
    val oldDb = if (name != null) (shell.eval("db") as StringResult).value else null
    if (name != null) shell.eval("use $name")

    block()

    if (oldDb != null) shell.eval("use $oldDb")
}

@Throws(IOException::class)
private fun compare(testDataPath: String, name: String, actual: String) {
    val mongohostport = getHostPort(readUri())
    var expectedFile = File("$testDataPath/$name.expected.txt")
    if (!expectedFile.exists()) {
        assertTrue(expectedFile.createNewFile())
        expectedFile.writeText(actual.trim())
        fail("Created output file $expectedFile")
    } else {
        for (counter in 1..10) {
            if (expectedFile.readText().trim() == actual.replace(mongohostport, "%mongohostport%").trim()) break

            val alternativeFile = File("$testDataPath/$name.expected.$counter.txt")
            if (alternativeFile.exists()) {
                expectedFile = alternativeFile
            }
        }
        assertEquals(expectedFile.readText().trim(), actual.replace(mongohostport, "%mongohostport%").trim())
    }
}

private val MONGO_ID_PATTERN = Pattern.compile("[0-9a-f]{24}")
private val MONGO_UUID_PATTERN = Pattern.compile("[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}")

private fun replaceId(value: String): String {
    return MONGO_ID_PATTERN.matcher(value).replaceAll("<ObjectID>")
}

private fun replaceUUID(value: String): String {
    return MONGO_UUID_PATTERN.matcher(value).replaceAll("<UUID>")
}

fun normalize(value: String) = replaceUUID(replaceId(value)).trim()

private val HEADER_PATTERN = Pattern.compile("//\\s*(?<name>\\S+)(?<properties>(\\s+\\S+)+)?")

class SectionHandler(val sectionName: String, val valueConsumer: (String, List<Pair<String, String>>) -> Unit)

private fun read(text: String, handlers: List<SectionHandler>) {
    var currentHandler: SectionHandler? = null
    var currentProperties = listOf<Pair<String, String>>()
    val currentSection = StringBuilder()
    text.split("\n").forEach { line ->
        val matcher = HEADER_PATTERN.matcher(line.trim())
        if (matcher.matches()) {
            currentHandler?.valueConsumer?.invoke(currentSection.toString(), currentProperties)
            currentSection.setLength(0)
            val headerName = matcher.group("name")
            currentHandler = handlers.find { it.sectionName == headerName }
            val props = matcher.group("properties")
            currentProperties = props?.trim()?.split(Pattern.compile("\\s+"))
                    ?.map { property ->
                        val eq = property.indexOf('=')

                        if (eq == -1) property to "true"
                        else property.substring(0, eq) to property.substring(eq + 1)
                    }
                    ?: listOf()
        } else {
            if (currentSection.isNotEmpty()) currentSection.append("\n")
            currentSection.append(line)
        }
    }
    currentHandler?.valueConsumer?.invoke(currentSection.toString(), currentProperties)
}

