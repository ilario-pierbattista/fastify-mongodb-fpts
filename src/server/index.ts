import { fastify, FastifyInstance } from "fastify"
import { pipe } from "fp-ts/lib/function"
import * as TE from 'fp-ts/TaskEither'

type ServerConfig = FastifyConfig

interface FastifyConfig {
    logger: boolean
}

export function configureServer(config: ServerConfig): TE.TaskEither<Error, FastifyInstance> {
    const x = pipe(
        TE.of<Error, FastifyInstance>(fastify({ logger: config.logger })),
        TE.map(app => {

            return app
        }),
        TE.map(app => {

            app.get('/', async (req, res) => {
                return {
                    data: 'hello world',
                }
            })

            return app
        })
    )
}

function loadPlugin(fastifyInstance: FastifyInstance): FastifyInstance {
    return fastifyInstance // TODO here I need to register plugins
}

