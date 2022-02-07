import {
  CollectibleAuctionBid,
  CollectibleAuctionWithDetails,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import { ApiClient } from '@/clients/api-client'
import { Analytics } from '@/clients/firebase-analytics'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getProfileImageForUser,
} from '@/services/api/auth-service'
import CollectibleAuction from '@/templates/collectible-auction-template'
import { isAfterNow } from '@/utils/date-time'

interface ReleasePageProps {
  avatars: { [key: string]: string | null }
  disallowBuyOrClaim: boolean | null
  isHighestBidder: boolean | null
  isOutbid: boolean | null
  isOwner: boolean | null
  isWinningBidder: boolean | null
  collectibleAuctionWithDetails: CollectibleAuctionWithDetails
}

export default function CollectibleAuctionPage({
  avatars,
  disallowBuyOrClaim,
  isHighestBidder,
  isOutbid,
  isOwner,
  isWinningBidder,
  collectibleAuctionWithDetails,
}: ReleasePageProps) {
  const { t } = useTranslation()

  const { collectibleTemplate, collectibleAuction, activeBid } =
    collectibleAuctionWithDetails

  useEffect(() => {
    // TODO: Should a lister be able to specify a minimum or starting bid?
    //   Issue: https://github.com/deptagency/algomart/issues/282
    const minimumBid = 1
    Analytics.instance.viewItem({
      itemName: collectibleTemplate.title,
      value: activeBid?.amount ?? minimumBid,
    })
  }, [activeBid, collectibleTemplate])

  const handleClaimNFT = async (): Promise<{ packId: string } | string> => {
    console.log(
      `handleClaimNFT called for collectibleAuctionId: ${collectibleAuction.id}}`
    )
    throw new Error('handleClaimNFT is not implemented') // TODO: Implement
  }

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Release', {
        name: collectibleTemplate.title,
      })}
      noPanel
    >
      <CollectibleAuction
        avatars={avatars}
        disallowBuyOrClaim={disallowBuyOrClaim}
        handleClaimNFT={handleClaimNFT}
        isHighestBidder={isHighestBidder}
        isOutbid={isOutbid}
        isOwner={isOwner}
        isWinningBidder={isWinningBidder}
        collectibleAuctionWithDetails={collectibleAuctionWithDetails}
      />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getAuthenticatedUser(context)

  const collectibleAuctionId = context?.params?.collectibleAuctionId as string
  const collectibleAuctionWithDetails =
    await ApiClient.instance.getCollectibleAuction(collectibleAuctionId)
  const { collectibleAuction, activeBid } = collectibleAuctionWithDetails
  if (!collectibleAuction) {
    return {
      notFound: true,
    }
  }

  const avatars: { [key: string]: string | null } = {}
  let isHighestBidder = null,
    isOwner = null,
    isWinningBidder = null,
    isOutbid = null

  // Get bidder avatars
  await Promise.all(
    collectibleAuction.bids.map(async ({ userAccount: { externalId } }) => {
      avatars[externalId] = await getProfileImageForUser(externalId)
    })
  )

  // Configure auction statuses
  if (user) {
    const isClosed = !!(
      collectibleAuction.endAt &&
      !isAfterNow(new Date(collectibleAuction.endAt))
    )
    const userHasBids = collectibleAuction.bids?.some(
      (b) => b.userAccount.externalId === user.externalId
    )

    isHighestBidder = activeBid?.userAccount.externalId === user.externalId
    isOwner =
      collectibleAuction.collectible.owner.externalId === user.externalId
    isWinningBidder = isHighestBidder && isClosed
    isOutbid = !isHighestBidder && userHasBids
  }

  return {
    props: {
      avatars,
      isHighestBidder,
      isOutbid,
      isOwner,
      isWinningBidder,
      collectibleAuctionWithDetails,
    },
  }
}
