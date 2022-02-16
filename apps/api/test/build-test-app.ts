import {
  AlgorandAdapter,
  CircleAdapter,
  CMSCacheAdapter,
  NFTStorageAdapter,
} from '@algomart/shared/adapters'

import buildApp from '../src/api/build-app'
import { configureResolver } from '../src/configuration/configure-resolver'

import { getTestDatabaseConfig } from './setup-tests'

export async function buildTestApp(database: string) {
  // jest
  //   .spyOn(CMSCacheAdapter.prototype, 'testConnection')
  //   .mockResolvedValue(Promise.resolve())

  jest
    .spyOn(AlgorandAdapter.prototype, 'testConnection')
    .mockResolvedValue(Promise.resolve())

  jest
    .spyOn(CircleAdapter.prototype, 'testConnection')
    .mockResolvedValue(Promise.resolve())

  jest
    .spyOn(NFTStorageAdapter.prototype, 'testConnection')
    .mockResolvedValue(Promise.resolve())

  return await buildApp({
    container: configureResolver(),
    knexMain: getTestDatabaseConfig(database),
    knexRead: getTestDatabaseConfig(database),
    fastify: {
      // uncomment to enable fastify logger
      // logger: { prettyPrint: true },
    },
  })
}
