import { fastify, FastifyInstance } from 'fastify'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'

type ServerConfig = FastifyConfig

interface FastifyConfig {
    logger: boolean
}

export function configureServer(config: ServerConfig): TE.TaskEither<Error, FastifyInstance> {
    return pipe(
        TE.of<Error, FastifyInstance>(fastify({ logger: config.logger })),
        TE.map(app => {
            return loadPlugins(app)
        }),
        TE.map(app => {
            app.get('/', async (_req, _res) => {
                return {
                    data: 'hello world',
                }
            })

            return app
        })
    )
}

function loadPlugins(fastifyInstance: FastifyInstance): FastifyInstance {
    return fastifyInstance // TODO here I need to register plugins
}
