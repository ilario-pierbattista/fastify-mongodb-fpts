import { fastify, FastifyInstance } from 'fastify'
import { string } from 'fp-ts'
import * as E from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { decodeEnvironment } from './config'

function resolve<T>(t: T): Promise<T> {
    return Promise.resolve(t)
}

pipe(
    decodeEnvironment(process.env),
    TE.chain(function (env): TE.TaskEither<Error, FastifyInstance> {

        const app: FastifyInstance = fastify({ logger: true })

        app.get('/', async (req, res) => {
            return {
                data: 'hello world'
            }
        })

        return TE.of<Error, FastifyInstance>(app)
    }),
    TE.chain(function (fastifyInstance): TE.TaskEither<Error, string> {
        return start(
            fastifyInstance,
            {
                bindAddress: '0.0.0.0',
                bindPort: 3000
            }
        )
    }),
    TE.bimap(
        console.error,
        console.log
    )
)()


interface ServerConfig {
    bindAddress: string
    bindPort: number
}

type AppConfiguration = ServerConfig

function start(fastifyInstance: FastifyInstance, configuration: AppConfiguration): TE.TaskEither<Error, string> {

    const listenTE = (fastifyInstance: FastifyInstance, config: ServerConfig): TE.TaskEither<Error, string> => {
        return () => fastifyInstance.listen({ port: config.bindPort, host: config.bindAddress })
            .then(flow(E.right, resolve))
            .catch(_ => pipe(new Error('Unable to start server'), E.left, resolve))
    }

    return pipe(
        listenTE(fastifyInstance, configuration),
        TE.map(
            addr => {
                console.log(`Listening on ${addr}`)
                return addr
            }
        )
    )
}


