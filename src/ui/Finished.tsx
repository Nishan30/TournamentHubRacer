import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { getScores } from '../data'
import { readableTime } from './LeaderBoard'
import type { SavedScore } from '../data'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { recordMatchResult, getLeaderboard } from '../contract/tournamentContract'
import { StrKey } from '@stellar/stellar-sdk'
import { Buffer } from 'buffer'
import type { ISupportedWallet } from 'stellar-wallets-kit'
import { StellarWalletsKit, WalletNetwork, WalletType } from 'stellar-wallets-kit'

const kit: StellarWalletsKit = new StellarWalletsKit({
  selectedWallet: WalletType.ALBEDO,
  network: WalletNetwork.TESTNET,
})

// Set the client in your kit
kit.startWalletConnect({
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string,
  name: 'Tournament Hub',
  description: 'Seamless Tournament Experience',
  url: 'https://tournamenthub.xyz',
  icons: ['https://avatars.mywebsite.com/'],
})

export const Finished = (): JSX.Element => {
  const [reset, time] = useStore(({ actions: { reset }, finished }) => [reset, finished])
  const [scoreId] = useState<SavedScore['id']>('')
  const [scores, setScores] = useState<SavedScore[]>([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [publicKey, setPublicKey] = useState('Wallet not Connected...')
  const [searchParams] = useSearchParams() // Access search params
  const scoreIdParam = searchParams.get('tourId')
  const [blockchainLeaderboard, setBlockchainLeaderboard] = useState<PlayerScore[]>([])
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showWallets, setShowWallets] = useState(false)
  const [wallets, setWallets] = useState<ISupportedWallet[]>([])

  const truncateAddress = (address: string) => {
    if (address.length <= 8) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  interface PlayerScore {
    playerAddress: string // Address of the player
    score: number // Player's score
  }

  useEffect(() => {
    const loadWallets = async () => {
      try {
        const supported = await StellarWalletsKit.getSupportedWallets()
        setWallets(supported)
      } catch (err) {
        console.error(err)
      }
    }
    loadWallets()
  }, [])

  // Connect wallet
  const handleConnectWallet = async (walletType: WalletType) => {
    try {
      setLoading(true)

      kit.setWallet(walletType)
      if (walletType === WalletType.WALLET_CONNECT) {
        await kit.connectWalletConnect()
      }
      const pk = await kit.getPublicKey()
      setPublicKey(pk)
    } catch (err) {
      if (err instanceof Error) {
        console.log(`Connection failed: ${err.message}`)
      } else {
        console.log('Connection failed: Unknown error')
      }
    } finally {
      setLoading(false)
      setShowWallets(false)
    }
  }

  const updatePosition = () => {
    //const index = scores.findIndex((score) => score.id === scoreId);
    //setPosition(index && index + 1);
  }

  const updateScores = () => {
    getScores().then(setScores)
  }

  const sendScore = async () => {
    if (!scoreIdParam) {
      toast.error('Please use a valid URL.')
      return
    }

    if (publicKey === 'Wallet not Connected...') {
      toast.error('Please connect your wallet first.')
      return
    }

    const scoreCalc = 100000 - time
    console.log(scoreCalc)
    console.log(time)

    setIsRegistering(true)
    try {
      await recordMatchResult(Number(scoreIdParam), kit, scoreCalc, publicKey)
      toast.success('Successfully registered for tournament!')
    } catch (error) {
      toast.error('Failed to register for tournament')
    } finally {
      setIsRegistering(false)
    }
  }
  const fetchBlockchainLeaderboard = async () => {
    if (!scoreIdParam) {
      toast.error('No active tournament found.')
      return
    }

    if (publicKey === 'Wallet not Connected...') {
      toast.error('Please connect your wallet first.')
      return
    }

    setIsFetchingLeaderboard(true)
    try {
      const leaderboard = await getLeaderboard(Number(scoreIdParam), kit, publicKey)
      console.log('Leaderboard fetched successfully:', leaderboard)

      // Process the leaderboard data
      const processedLeaderboard = processLeaderboardData(leaderboard)
      console.log('Processed Leaderboard:', processedLeaderboard)
      setBlockchainLeaderboard(processedLeaderboard)

      toast.success('Leaderboard fetched successfully!')
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      toast.error('Failed to fetch leaderboard.')
    } finally {
      setIsFetchingLeaderboard(false)
    }
  }

  const convertUint8ArrayToStellarAddress = (uint8Array: Uint8Array): string => {
    try {
      // Convert Uint8Array to a Stellar public key (address)
      const buffer = Buffer.from(uint8Array)
      const stellarAddress = StrKey.encodeEd25519PublicKey(buffer)
      return stellarAddress
    } catch (error) {
      console.error('Error converting Uint8Array to Stellar address:', error)
      return 'Invalid Address'
    }
  }
  // Function to process the raw leaderboard data
  const processLeaderboardData = (leaderboard: any): PlayerScore[] => {
    if (!leaderboard || !leaderboard._value || !Array.isArray(leaderboard._value)) {
      console.error('Invalid leaderboard data structure:', leaderboard)
      return []
    }

    const processedData: PlayerScore[] = []

    // Iterate through the list of players
    leaderboard._value.forEach((playerData: any) => {
      // Extract player address, score, and timestamp
      const player = playerData._value[0]._attributes.val._value._value._value // Player address
      const playerAddress = convertUint8ArrayToStellarAddress(player)
      const rawScore = Number(playerData._value[1]._attributes.val._value) // Raw score from blockchain
      const actualTime = (100000 - rawScore) / 1000 // Calculate actual time in seconds

      processedData.push({
        playerAddress,
        score: actualTime, // Store the actual time as the score
      })
    })

    return processedData
  }

  useEffect(updateScores, [time])
  useEffect(updatePosition, [scoreId, scores])

  return (
    <div className="finished">
      <div className="result-container">
        {/* Header */}
        <div className="result-header">
          <h1>Good job! 🎉</h1>
          <p>
            Your time: <span>{readableTime(time)}</span>
          </p>
        </div>

        <div className="wallet-connect-container max-w-xs mx-auto mb-6">
          <div className="relative">
            <button className={`wallet-button ${publicKey.startsWith('G') ? 'connected' : ''}`} onClick={() => setShowWallets(!showWallets)} disabled={loading}>
              {loading ? <>Connecting...</> : <>{publicKey.startsWith('G') ? 'Connected' : 'Connect Wallet'}</>}
            </button>

            {showWallets && (
              <div className="wallet-dropdown">
                {wallets.map(
                  (wallet) =>
                    wallet.isAvailable && (
                      <button key={wallet.type} className="wallet-option" onClick={() => handleConnectWallet(wallet.type)}>
                        <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 object-contain" />
                        <span className="text-sm">{wallet.name}</span>
                      </button>
                    ),
                )}
              </div>
            )}
          </div>

          {publicKey.startsWith('G') && (
            <div className="connection-status mt-3">
              Connected: <span>{truncateAddress(publicKey)}</span>
            </div>
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="leaderboard-section">
          <div className="leaderboard-header">
            <h2>Tournament Leaderboard</h2>
            <button onClick={fetchBlockchainLeaderboard} className="secondary-button" disabled={isFetchingLeaderboard}>
              {isFetchingLeaderboard ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {blockchainLeaderboard.length > 0 ? (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {blockchainLeaderboard.map((player, index) => (
                  <tr key={player.playerAddress}>
                    <td>#{index + 1}</td>
                    <td>{truncateAddress(player.playerAddress)}</td>
                    <td>{player.score.toFixed(2)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No leaderboard data available yet</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={sendScore} className="submit-button" disabled={isRegistering}>
            {isRegistering ? 'Submitting...' : 'Submit Tournament Score'}
          </button>

          <div className="button-group">
            <button onClick={fetchBlockchainLeaderboard} className="secondary-button" disabled={isFetchingLeaderboard}>
              {isFetchingLeaderboard ? 'Refreshing...' : 'Refresh Leaderboard'}
            </button>
            <button onClick={reset} className="secondary-button">
              Restart Game
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
