import { NotificationsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'
import pino from 'pino'

export default async function dispatchNotificationsTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>,
  knexRead?: Knex
) {
  const log = logger.child({ task: 'dispatch-notifications' })
  const notifications = registry.get<NotificationsService>(
    NotificationsService.name
  )

  const trx = await Model.startTransaction()
  try {
    await notifications.dispatchNotifications(trx, knexRead)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to dispatch notifications')
  }
}
