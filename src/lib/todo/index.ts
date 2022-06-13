import * as E from 'fp-ts/Either'
import type * as RTE from 'fp-ts/ReaderTaskEither'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import type { ClientSession } from 'mongodb'
import type { MongoService } from '../../services/mongodb'

type Todo = t.TypeOf<typeof TodoType>
type TodoPersisted = t.TypeOf<typeof persistedTodoType>

interface TodoRepository {
    create: RTE.ReaderTaskEither<Todo, Error, TodoPersisted>
}

const TodoType = t.type({
    userId: t.number,
    summary: t.string,
    body: t.union([t.string, t.null, t.undefined]),
    dueDate: t.string,
})

const persistedTodoType = t.intersection([
    t.type({
        _id: t.string,
    }),
    TodoType,
])

export const buildTodoRepository: RTE.ReaderTaskEither<{ mongodb: MongoService }, Error, TodoRepository> = ({
    mongodb: { mongodb },
}) =>
    TE.of<Error, TodoRepository>({
        create: todo => {
            const session = mongodb.client.startSession()

            function workToDo(session: ClientSession): TE.TaskEither<Error, TodoPersisted> {
                return pipe(
                    TE.tryCatch(
                        () => mongodb.db.collection('todo').insertOne(todo, { session }),
                        _ => new Error('Error inserting things')
                    ),
                    TE.chain(result =>
                        TE.tryCatch(
                            () => mongodb.db.collection('todo').findOne({ _id: result.insertedId }),
                            _ => new Error('Error finding document')
                        )
                    ),
                    TE.chain(result => {
                        const decoded = persistedTodoType.decode(result)

                        return pipe(
                            decoded,
                            E.mapLeft(
                                _ => new Error(`Error decoding inserted document ${PathReporter.report(decoded)}`)
                            ),
                            TE.fromEither
                        )
                    })
                )
            }
            workToDo(session) // This is useless

            // function teTransacton<A>(session: ClientSession, inTransaction: TE.TaskEither<Error, A>): TE.TaskEither<Error, A> {
            //     return pipe(
            //         TE.tryCatch(
            //             () => session.withTransaction(
            //                 () => inTransaction()
            //             ),
            //             () => new Error('Error')
            //         ),
            //         c => c
            //     )
            // }

            // TODO how to deal with transactions?

            // const c = pipe(
            //     TE.tryCatch(
            //         () => session.withTransaction(() => workToDo(session)),
            //         () => new Error('Error doing transaction')
            //     )
            // )

            return pipe(
                TE.tryCatch(
                    () => mongodb.db.collection('todo').insertOne(todo),
                    _ => new Error('Error inserting things')
                ),
                TE.chain(result =>
                    TE.tryCatch(
                        () => mongodb.db.collection('todo').findOne({ _id: result.insertedId }, { session }),
                        _ => new Error('Error finding document')
                    )
                ),
                TE.chain(result => {
                    const decoded = persistedTodoType.decode(result)

                    return pipe(
                        decoded,
                        E.mapLeft(_ => new Error(`Error decoding inserted document ${PathReporter.report(decoded)}`)),
                        TE.fromEither
                    )
                })
            )
        },
    })
