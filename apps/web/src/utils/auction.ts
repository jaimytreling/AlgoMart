export const getNotificationDetails = (
  isWinningBidder,
  isHighestBidder,
  isOutbid,
  t
): {
  content: string
  color: 'red' | 'blue' | 'green'
} | null => {
  if (isWinningBidder) {
    return { content: `${t('release:You won the auction')}!`, color: 'green' }
  } else if (isHighestBidder) {
    return { content: t('release:highBidder'), color: 'green' }
  } else if (isOutbid) {
    return { content: t('release:You were outbid'), color: 'red' }
  }
  return null
}
