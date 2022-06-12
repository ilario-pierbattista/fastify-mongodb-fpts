import { fastify, FastifyInstance } from 'fastify'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { decodeEnvironment } from './config'

pipe(
    decodeEnvironment(process.env),
    TE.chain((env): TE.TaskEither<Error, FastifyInstance> => {
        const app: FastifyInstance = fastify({ logger: true })

        app.get('/', async (req, res) => {
            return {
                data: 'hello world',
            }
        })

        return TE.of<Error, FastifyInstance>(app)
    }),
    TE.chain((fastifyInstance): TE.TaskEither<Error, string> => {
        return start(fastifyInstance, {
            bindAddress: '0.0.0.0',
            bindPort: 3000,
        })
    }),
    TE.bimap(console.error, console.log)
)()

interface ServerConfig {
    bindAddress: string
    bindPort: number
}

type AppConfiguration = ServerConfig

function start(fastifyInstance: FastifyInstance, config: AppConfiguration): TE.TaskEither<Error, string> {
    return pipe(
        TE.tryCatch(
            () => fastifyInstance.listen({ port: config.bindPort, host: config.bindAddress }),
            (_) => new Error('Unable to start server')
        ),
        TE.map(addr => {
            console.log(`Listening on ${addr}`)
            return addr
        })
    )
}
