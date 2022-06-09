import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'

const envType = t.type(
    {
        MONGODB_URL: t.string,
        MONGODB_DATABASE: t.string
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
            r => Promise.resolve(r),
        )
    }
}
