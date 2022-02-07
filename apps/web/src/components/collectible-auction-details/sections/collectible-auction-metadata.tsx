import {
  CollectibleAuctionStatus,
  CollectibleAuctionWithDetails,
  PackType,
} from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from '@/components/collectible-auction-details/sections/collectible-auction-metadata.module.css'

import Counter from '@/components/counter/counter'
import { formatCurrency } from '@/utils/format-currency'

const { Active, Closed, New } = CollectibleAuctionStatus

export interface ReleaseMetadataProps {
  collectibleAuctionWithDetails: CollectibleAuctionWithDetails
}

export default function CollectibleAuctionMetadata({
  collectibleAuctionWithDetails,
}: ReleaseMetadataProps) {
  const { t, lang } = useTranslation()

  const { collectibleAuction, activeBid } = collectibleAuctionWithDetails

  const highestBid = activeBid?.amount || 0
  const price = 1 // TODO:
  const startDateTime = collectibleAuction.startAt as string
  const isActive = collectibleAuction.status === Active
  const isClosed = collectibleAuction.status === Closed
  const isNew = collectibleAuction.status === New

  const isUpcomingAuction = isNew && startDateTime
  const isReserveMet = highestBid >= price

  // Upcoming auctions are treated uniquely as a full column counter
  if (isUpcomingAuction) {
    return (
      <div className={css.metadata}>
        <div className={css.column}>
          <div className={css.metadataLabel}>
            {t('release:Auction begins in')}
          </div>
          <div className={css.metadataValue}>
            <Counter
              includeDaysInPlainString
              plainString
              target={new Date(startDateTime)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx(css.metadata, {
        [css.active]: isActive,
        [css.metadataGrid]: !isUpcomingAuction,
      })}
    >
      {/* Left Column */}
      <div className={css.column}>
        {
          <>
            <div className={css.metadataLabel}>
              {isActive
                ? t('release:Current Bid')
                : isReserveMet
                ? t('release:Winning Bid')
                : t('release:Highest Bid')}
            </div>
            <div
              className={clsx(css.metadataValue, {
                [css.completeSuccess]: isClosed && isReserveMet,
              })}
            >
              {formatCurrency(highestBid, lang)}
            </div>
          </>
        }
      </div>

      {/* Center Column */}
      <div className={css.column}>
        {
          <>
            <div className={css.metadataLabel}>
              {t('release:Reserve Price')}
            </div>
            <div
              className={clsx(css.metadataValue, {
                [css.completeSuccess]: isReserveMet,
              })}
            >
              {isReserveMet ? t('release:Met') : t('release:Not Met')}
            </div>
          </>
        }
      </div>

      {/* Right Column */}
      <div className={css.column}>
        {
          <>
            <div className={css.metadataLabel}>
              {isActive ? t('release:Ending In') : t('release:Auction Has')}
            </div>
            <div className={css.metadataValue}>
              {isActive ? (
                <Counter
                  plainString
                  target={new Date(collectibleAuction.endAt as string)}
                />
              ) : (
                t('release:Ended')
              )}
            </div>
          </>
        }
      </div>
    </div>
  )
}
