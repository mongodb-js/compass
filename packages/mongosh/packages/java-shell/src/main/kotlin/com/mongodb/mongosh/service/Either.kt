package com.mongodb.mongosh.service

internal sealed class Either<out T> {
    abstract fun <T1> map(transform: (T) -> T1): Either<T1>
    abstract fun <T1> flatMap(transform: (T) -> Either<T1>): Either<T1>
    abstract fun getOrThrow(): T
}

internal class Left<T>(val value: Throwable) : Either<T>() {
    override fun <T1> map(transform: (T) -> T1): Either<T1> {
        return Left(value)
    }

    override fun <T1> flatMap(transform: (T) -> Either<T1>): Either<T1> {
        return Left(value)
    }

    override fun getOrThrow() = throw value
}

internal class Right<T>(val value: T) : Either<T>() {
    override fun <T1> map(transform: (T) -> T1): Either<T1> {
        return Right(transform(value))
    }

    override fun <T1> flatMap(transform: (T) -> Either<T1>): Either<T1> {
        return transform(value)
    }

    override fun getOrThrow() = value
}