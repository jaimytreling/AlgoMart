import ajvCompiler from '@fastify/ajv-compiler'
import ajvFormats from 'ajv-formats'
import fastify, { FastifyServerOptions } from 'fastify'
import { fastifySchedule } from 'fastify-schedule'
import fastifySensible from 'fastify-sensible'
import fastifySwagger from 'fastify-swagger'
import { Knex } from 'knex'

import swaggerOptions from '@/configuration/swagger'
import { accountsRoutes } from '@/modules/accounts'
import { auctionsRoutes } from '@/modules/auctions'
import { bidsRoutes } from '@/modules/bids'
import { collectiblesRoutes } from '@/modules/collectibles'
import { collectionsRoutes } from '@/modules/collections'
import { faqsRoutes } from '@/modules/faqs'
import { homepageRoutes } from '@/modules/homepage'
import { i18nRoutes } from '@/modules/i18n'
import { packsRoutes } from '@/modules/packs'
import { pageRoute } from '@/modules/pages'
import { paymentRoutes } from '@/modules/payments'
import { setsRoutes } from '@/modules/sets'
import fastifyContainer from '@/plugins/container.plugin'
import fastifyKnex from '@/plugins/knex.plugin'
import fastifyTransaction from '@/plugins/transaction.plugin'
import DependencyResolver from '@/shared/dependency-resolver'

export interface AppConfig {
  knexMain: Knex.Config
  knexRead: Knex.Config
  fastify?: FastifyServerOptions
  container: DependencyResolver
}

export default async function buildApp(config: AppConfig) {
  const app = fastify(
    Object.assign({}, config.fastify, {
      // https://www.nearform.com/blog/upgrading-fastifys-input-validation-to-ajv-version-8/
      // https://www.fastify.io/docs/latest/Server/#schemacontroller
      schemaController: {
        compilersFactory: {
          buildValidator: ajvCompiler(),
        },
      },

      ajv: {
        customOptions: {
          removeAdditional: true,
          useDefaults: true,
          allErrors: true,
          validateFormats: true,
          // Need to coerce single-item arrays to proper arrays
          coerceTypes: 'array',
          // New as of Ajv v7, strict schema is not compatible with TypeBox
          // The alternative is to wrap EVERYTHING with Type.Strict(...)
          strictSchema: false,
        },
        plugins: [ajvFormats],
      },
    })
  )

  // Plugins
  await app.register(fastifySchedule)
  await app.register(fastifySwagger, swaggerOptions)
  await app.register(fastifySensible)

  // Our Plugins
  await app.register(fastifyKnex, { knex: config.knexMain, name: 'knexMain' })
  await app.register(fastifyKnex, { knex: config.knexRead, name: 'knexRead' })
  await app.register(fastifyContainer, { container: config.container })
  await app.register(fastifyTransaction)

  // Decorators
  // no decorators yet

  // Hooks
  // no hooks yet

  // Services
  await app.register(accountsRoutes, { prefix: '/accounts' })
  await app.register(auctionsRoutes, { prefix: '/auctions' })
  await app.register(bidsRoutes, { prefix: '/bids' })
  await app.register(collectiblesRoutes, { prefix: '/collectibles' })
  await app.register(collectionsRoutes, { prefix: '/collections' })
  await app.register(homepageRoutes, { prefix: '/homepage' })
  await app.register(i18nRoutes, { prefix: '/i18n' })
  await app.register(faqsRoutes, { prefix: '/faqs' })
  await app.register(packsRoutes, { prefix: '/packs' })
  await app.register(paymentRoutes, { prefix: '/payments' })
  await app.register(setsRoutes, { prefix: '/sets' })
  await app.register(pageRoute, { prefix: '/page' })

  return app
}
