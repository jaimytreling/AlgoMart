import { BrandListWithTotalSchema, LocaleSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { getBrands } from './brands.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

export async function brandsRoutes(app: FastifyInstance) {
  const tags = ['brands']
  const security = [
    {
      'API Key': [],
    },
  ]

  // Errors
  app.setErrorHandler(appErrorHandler(app))

  // Plugins
  await app.register(fastifyBearerAuth, bearerAuthOptions)

  // Services/Routes
  app.get(
    '/',
    {
      schema: {
        tags,
        security,
        querystring: LocaleSchema,
        response: {
          200: BrandListWithTotalSchema,
        },
      },
    },
    getBrands
  )
}
