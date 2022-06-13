import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { Db, MongoClient } from 'mongodb'

export interface MongoService {
    mongodb: {
        client: MongoClient
        db: Db
    }
}

export interface MongoServiceConfig {
    url: string
    dabatase: string
}

export function createMongoService(config: MongoServiceConfig): TE.TaskEither<Error, MongoService> {
    return pipe(
        TE.tryCatch(
            () => MongoClient.connect(config.url),
            _ => new Error('Error creating MongoClient')
        ),
        TE.map(
            (client): MongoService => ({
                mongodb: {
                    client: client,
                    db: client.db(config.dabatase),
                },
            })
        )
    )
}
