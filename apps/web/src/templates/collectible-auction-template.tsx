import {
  CollectibleAuctionStatus,
  CollectibleAuctionWithDetails,
} from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './release-template.module.css'

import Alert from '@/components/alert/alert'
import AlertMessage from '@/components/alert-message/alert-message'
import CollectibleAuctionDetails from '@/components/collectible-auction-details/collectible-auction-details'
import MediaGallery from '@/components/media-gallery/media-gallery'
import { useAuth } from '@/contexts/auth-context'
import { getNotificationDetails } from '@/utils/auction'
import { isAfterNow } from '@/utils/date-time'

export interface CollectibleAuctionProps {
  avatars: { [key: string]: string | null }
  disallowBuyOrClaim: boolean | null
  handleClaimNFT: (redeemCode: string) => Promise<{ packId: string } | string>
  isHighestBidder: boolean | null
  isOutbid: boolean | null
  isOwner: boolean | null
  isWinningBidder: boolean | null
  collectibleAuctionWithDetails: CollectibleAuctionWithDetails
}

export default function CollectibleAuction({
  avatars,
  disallowBuyOrClaim,
  isHighestBidder,
  isOutbid,
  isOwner,
  isWinningBidder,
  collectibleAuctionWithDetails,
}: CollectibleAuctionProps) {
  const { user } = useAuth()
  const { t } = useTranslation()

  const { collectibleAuction, collectibleTemplate } =
    collectibleAuctionWithDetails

  const startDateTime = collectibleAuction.startAt
  const endDateTime = collectibleAuction.endAt

  const isEnded = endDateTime && !isAfterNow(new Date(endDateTime))
  const isActiveStatus =
    collectibleAuction.status === CollectibleAuctionStatus.Active
  const isActive =
    isActiveStatus &&
    startDateTime &&
    !isAfterNow(new Date(startDateTime)) &&
    !isEnded
  const isInFuture = startDateTime && isAfterNow(new Date(startDateTime))
  const isAlertDisplayed = user && !isOwner

  const handleClaimNFTFlow = () => {
    console.log(`handleClaimNFTFlow for ${collectibleAuction.id}`)
    throw new Error('handleClaimNFTFlow is not implemented') // TODO: Implement
  }

  const getAlertText = () => {
    if (isWinningBidder && isEnded) {
      return `🏆 ${t('release:You won the auction')}! ${t(
        'release:Claim your NFT now'
      )}:`
    } else if (isEnded) {
      return `🎬 ${t('release:This auction has ended')}.`
    }
    if (isActiveStatus && isActive && endDateTime) {
      return `🚨 ${t('release:This auction is live')}:`
    }
    if (isInFuture && !isEnded) {
      return `⏰ ${t('release:Auction begins in')}`
    }
  }

  const alertText = getAlertText()
  const notificationDetails = getNotificationDetails(
    isWinningBidder,
    isHighestBidder,
    isOutbid,
    t
  )
  return (
    <article className={css.root}>
      {notificationDetails && (
        <AlertMessage
          className={css.notification}
          content={notificationDetails.content}
          showBorder
          variant={notificationDetails.color}
        />
      )}
      <div className={css.content}>
        {isAlertDisplayed && alertText && (
          <Alert
            callToAction={
              isActive
                ? t('common:actions.Place Bid')
                : isWinningBidder
                ? t('common:actions.Claim NFT')
                : null
            }
            centerContent={false}
            className={isWinningBidder ? css.alert : undefined}
            content={alertText}
            counterEndTime={
              isActive
                ? endDateTime
                : isInFuture && !isEnded
                ? startDateTime
                : null
            }
            counterText={isActive ? t('release:Ending In') : null}
            handleClick={handleClaimNFTFlow}
          />
        )}

        {/* Media Gallery */}
        <MediaGallery media={[collectibleTemplate.image]} />

        {/* Release Details */}
        <section>
          <CollectibleAuctionDetails
            avatars={avatars}
            disallowBuyOrClaim={disallowBuyOrClaim}
            isOwner={isOwner}
            isWinningBidder={isWinningBidder}
            onCheckout={handleClaimNFTFlow}
            collectibleAuctionWithDetails={collectibleAuctionWithDetails}
          />
        </section>
      </div>
      {/*TODO: Claim NFT Modal*/}
    </article>
  )
}
