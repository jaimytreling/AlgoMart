import {
  CollectibleAuctionStatus,
  CollectibleAuctionWithDetails,
  PackStatus,
  PackType,
} from '@algomart/schemas'
import { useRouter } from 'next/router'

import css from '@/components/collectible-auction-details/collectible-auction-details.module.css'

import CollectibleAuctionMetadata from '@/components/collectible-auction-details/sections/collectible-auction-metadata'
import ReleaseCta from '@/components/release-details/sections/release-cta'
import ReleaseDescription from '@/components/release-details/sections/release-description'
import { urls } from '@/utils/urls'

export interface ReleaseDetailsProps {
  avatars: { [key: string]: string | null }
  disallowBuyOrClaim: boolean | null
  isOwner: boolean | null
  isWinningBidder: boolean | null

  onCheckout(): void

  collectibleAuctionWithDetails: CollectibleAuctionWithDetails
}

export default function CollectibleAuctionDetails({
  disallowBuyOrClaim,
  isOwner,
  isWinningBidder,
  onCheckout,
  collectibleAuctionWithDetails,
}: ReleaseDetailsProps) {
  const { push } = useRouter()
  const { collectibleAuction, collectibleTemplate } =
    collectibleAuctionWithDetails
  return (
    <section className={css.root}>
      {/* Title */}
      <div className={css.header}>
        <h1 className={css.title}>{collectibleTemplate.title}</h1>
      </div>
      {/* Metadata */}
      <CollectibleAuctionMetadata
        collectibleAuctionWithDetails={collectibleAuctionWithDetails}
      />
      {/* Show CTA when active */}
      {(collectibleAuction.status === CollectibleAuctionStatus.Active ||
        (collectibleAuction.status === CollectibleAuctionStatus.Closed &&
          isWinningBidder)) && (
        <ReleaseCta
          disallowBuyOrClaim={disallowBuyOrClaim}
          isOwner={isOwner}
          isWinningBidder={isWinningBidder}
          onClick={isOwner ? () => push(urls.myCollectibles) : onCheckout}
          releaseIsAvailable={true} // TODO:
          status={PackStatus.Active} // TODO:
          type={PackType.Auction} // TODO:
        />
      )}
      {/* Description content */}
      {collectibleTemplate.body && (
        <ReleaseDescription description={collectibleTemplate.body} />
      )}
      {/* TODO: Bidding activity */}
    </section>
  )
}
