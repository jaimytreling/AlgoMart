import pino from 'pino'
import { Countries, DEFAULT_LOCALE } from '@algomart/schemas'
import { CMSCacheAdapter } from '@algomart/shared/adapters'
import { invariant } from '@algomart/shared/utils'

export class ApplicationService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: CMSCacheAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async getCountries(locale = DEFAULT_LOCALE): Promise<Countries> {
    // Find application details and compile IDs of supported countries
    const application = await this.cms.findApplication()
    invariant(application?.countries?.length > 0, 'No countries found')
    const countryCodes = application.countries.map(
      ({ countries_code }) => countries_code.code
    )

    // Search for countries
    const countries = (await this.cms.findAllCountries(locale)).filter(
      ({ code }) => countryCodes.includes(code)
    )
    return countries
  }
}
