import * as E from 'fp-ts/Either'
import type * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import type { MongoServiceConfig } from '../services/mongodb'

const envType = t.strict(
    {
        MONGODB_URL: t.string,
        MONGODB_DATABASE: t.string,
    },
    'Environment'
)

export type environment = t.TypeOf<typeof envType>

export function decodeEnvironment(env: unknown): TE.TaskEither<Error, environment> {
    return () => {
        const decoded = envType.decode(env)

        return pipe(
            decoded,
            E.mapLeft(_ => {
                return new Error(`Error decoding ENV ${PathReporter.report(decoded)}`)
            }),
            r => Promise.resolve(r)
        )
    }
}

export function buildMongoServiceConfig(env: environment): MongoServiceConfig {
    return {
        dabatase: env.MONGODB_DATABASE,
        url: env.MONGODB_URL,
    }
}
