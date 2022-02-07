import {
  AlgorandTransactionStatus,
  CollectibleAuctionStatus,
  CreateAuctionBody,
} from '@algomart/schemas'
import algosdk from 'algosdk'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Transaction } from 'objection'

import AlgorandAdapter from '@/lib/algorand-adapter'
import DirectusAdapter from '@/lib/directus-adapter'
import { AlgorandTransactionModel } from '@/models/algorand-transaction.model'
import { CollectibleModel } from '@/models/collectible.model'
import { CollectibleAuctionModel } from '@/models/collectible-auction.model'
import { UserAccountModel } from '@/models/user-account.model'
import { decrypt } from '@/utils/encryption'
import { invariant, userInvariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

export default class AuctionsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(
    private readonly algorand: AlgorandAdapter,
    private readonly cms: DirectusAdapter
  ) {}

  async createAuction(request: CreateAuctionBody, trx?: Transaction) {
    const user = await UserAccountModel.query(trx)
      .where({
        externalId: request.externalId,
      })
      .withGraphJoined('algorandAccount')
      .first()
    userInvariant(user, 'User not found', 404)
    const mnemonic = decrypt(
      user.algorandAccount?.encryptedKey,
      request.passphrase
    )
    userInvariant(mnemonic, 'Invalid passphrase', 400)

    const { collectibleId, reservePrice, startAt, endAt } = request
    const collectible = await CollectibleModel.query(trx)
      .where({
        id: collectibleId,
        ownerId: user.id,
      })
      .first()
    userInvariant(collectible, 'Collectible not found', 404)

    this.logger.info({
      collectible,
      user,
    })

    const approvalProgramBytes = await this.algorand.compileContract(
      await fs.readFile(
        path.join(__dirname, 'contracts', 'auction_approval.teal'),
        'utf8'
      )
    )

    const clearStateProgramBytes = await this.algorand.compileContract(
      await fs.readFile(
        path.join(__dirname, 'contracts', 'auction_clear_state.teal'),
        'utf8'
      )
    )

    const txnFee = 1000
    const numberGlobalByteSlices = 2
    const numberGlobalInts = 7
    const accountInfo = await this.algorand.getAccountInfo(
      user.algorandAccount?.address
    )
    const minBalance =
      txnFee +
      this.algorand.getAccountMinBalance(accountInfo) +
      this.algorand.appMinBalance({
        numGlobalByteSlices: numberGlobalByteSlices,
        numGlobalInts: numberGlobalInts,
      }).create

    userInvariant(
      accountInfo.amount >= minBalance,
      `Insufficient balance, need ${minBalance}, has ${accountInfo.amount}`,
      400
    )

    const { transactionId, signedTransaction } =
      await this.algorand.createApplicationTransaction({
        appArgs: [
          algosdk.decodeAddress(user.algorandAccount?.address).publicKey,
          algosdk.encodeUint64(collectible.address),
          algosdk.encodeUint64(Math.floor(new Date(startAt).getTime() / 1000)),
          algosdk.encodeUint64(Math.floor(new Date(endAt).getTime() / 1000)),
          algosdk.encodeUint64(reservePrice),
          algosdk.encodeUint64(100_000), // TODO: remove hard code
        ],
        approvalProgram: approvalProgramBytes,
        clearProgram: clearStateProgramBytes,
        numGlobalByteSlices: numberGlobalByteSlices,
        numGlobalInts: numberGlobalInts,
      })
    this.logger.info({ signedTransaction }, 'transaction')
    await this.algorand.submitTransaction(signedTransaction)
    // TODO:
    //   1. Add 100,000 microAlgos to the application's account to satisfy increased minimum balance requirement for additional asset holding
    //   2. Opt the application's account into holding asset to be auctioned
    //   3. Transfer the asset to the application's account

    const transaction = await AlgorandTransactionModel.query(trx).insert({
      address: transactionId,
      status: AlgorandTransactionStatus.Pending,
    })

    await CollectibleAuctionModel.query(trx).insert({
      collectibleId,
      reservePrice,
      startAt,
      endAt,
      appId: 999, /// TODO:
      status: CollectibleAuctionStatus.New,
      transactionId: transaction.id,
      userAccountId: user.id,
    })
  }

  async getCollectibleAuctionById(collectibleAuctionId: string) {
    const collectibleAuction = await CollectibleAuctionModel.query()
      .findById(collectibleAuctionId)
      .withGraphJoined('[collectible.owner, bids.userAccount, userAccount]')
    userInvariant(collectibleAuction, 'CollectibleAuction not found', 404)

    const {
      collectibles: [collectibleTemplate],
    } = await this.cms.findAllCollectibles(
      undefined,
      { id: collectibleAuction.collectible.templateId },
      1
    )
    invariant(collectibleTemplate, 'collectibleTemplate not found')
    return { collectibleAuction, collectibleTemplate }
  }
}
