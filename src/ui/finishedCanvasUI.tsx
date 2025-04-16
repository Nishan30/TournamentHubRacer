import React, { useEffect, useState, useCallback } from 'react' // Removed useMemo
import type { ISupportedWallet } from 'stellar-wallets-kit'
import { StellarWalletsKit, WalletNetwork, WalletType } from 'stellar-wallets-kit'
import { StrKey } from '@stellar/stellar-sdk'
import { Buffer } from 'buffer' // Ensure buffer is polyfilled if needed for browser
import toast from 'react-hot-toast'
// Adjust the path to your contract functions as needed
import { recordMatchResult, getLeaderboard } from '../contract/tournamentContract'
// You might need a CSS file or use Tailwind classes directly
import './FinishedCanvasUI.css' // Create or adapt this CSS file

// Define the structure for leaderboard entries expected from the contract processing
interface PlayerScore {
  playerAddress: string
  score: number // This will be the direct game score
  rank?: number // Optional rank added during processing
}

// --- Wallet Kit Setup ---
// Memoize to prevent re-initialization on every render
const kit: StellarWalletsKit = new StellarWalletsKit({
  selectedWallet: WalletType.ALBEDO,
  network: WalletNetwork.TESTNET,
})

// Configure WalletConnect (ensure VITE_WALLETCONNECT_PROJECT_ID is set)
if (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
  kit.startWalletConnect({
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string,
    name: 'Math Runner Game', // Game's name
    description: 'Math Runner Score Submission',
    url: window.location.origin,
    icons: [], // Add your game's icon URL(s) here
  })
} else {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID not set in .env file. WalletConnect will be disabled.')
}

// Helper function to truncate Stellar addresses
const truncateAddress = (address: string): string => {
  if (!address || address.length <= 8) return address || 'N/A'
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

// Helper to convert contract's address format (ensure this matches your contract's output)
const convertUint8ArrayToStellarAddress = (uint8Array: Uint8Array): string => {
  try {
    // Ensure input is a valid Uint8Array-like object
    if (!uint8Array || typeof uint8Array.length !== 'number') {
      throw new Error('Invalid input: Expected Uint8Array')
    }
    const buffer = Buffer.from(uint8Array)
    // Ensure buffer has the correct length for an Ed25519 public key
    if (buffer.length !== 32) {
      throw new Error(`Invalid buffer length: Expected 32, got ${buffer.length}`)
    }
    return StrKey.encodeEd25519PublicKey(buffer)
  } catch (error) {
    console.error('Error converting Uint8Array to Stellar address:', error, 'Input:', uint8Array)
    return 'Invalid Address'
  }
}

// --- Component Props Definition ---
interface FinishedCanvasUIProps {
  score: number // The final player score from the game
  onRestart: () => void // Function provided by the parent to restart the game
  tournamentId: string | null // Tournament ID from URL params (passed by parent)
}

export const FinishedCanvasUI: React.FC<FinishedCanvasUIProps> = ({ score, onRestart, tournamentId }) => {
  // --- State Variables ---
  const [isSubmitting, setIsSubmitting] = useState(false) // Tracks score submission status
  const [publicKey, setPublicKey] = useState('') // Stores connected wallet's public key
  const [loadingWallet, setLoadingWallet] = useState(false) // Tracks wallet connection status
  const [showWallets, setShowWallets] = useState(false) // Controls visibility of wallet dropdown
  const [wallets, setWallets] = useState<ISupportedWallet[]>([]) // Stores list of available wallets
  const [blockchainLeaderboard, setBlockchainLeaderboard] = useState<PlayerScore[]>([]) // Stores fetched leaderboard
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false) // Tracks leaderboard fetch status
  const [scoreSubmitted, setScoreSubmitted] = useState(false) // Prevents duplicate submissions in one session

  // --- Load available wallets on component mount ---
  useEffect(() => {
    const loadWallets = async () => {
      try {
        const supported = await StellarWalletsKit.getSupportedWallets()
        setWallets(supported)
      } catch (err) {
        console.error('Error loading wallets:', err)
        toast.error('Could not load wallet options.')
      }
    }
    loadWallets()
  }, []) // Empty dependency array means this runs once on mount

  // --- Wallet Connection Handler ---
  const handleConnectWallet = useCallback(async (walletType: WalletType) => {
    try {
      setLoadingWallet(true)
      kit.setWallet(walletType) // Set the chosen wallet type in the kit

      // Initiate WalletConnect connection flow if that type is selected
      if (walletType === WalletType.WALLET_CONNECT) {
        await kit.connectWalletConnect()
      }

      const pk = await kit.getPublicKey() // Get the public key after connection
      setPublicKey(pk)
      toast.success('Wallet connected!')
      setShowWallets(false) // Close dropdown after successful connection

      // Automatically fetch leaderboard if connected and tournament ID exists
      // NOTE: Fetching is handled by the useEffect watching publicKey now
      // if (tournamentId) {
      //     fetchBlockchainLeaderboard(pk, tournamentId); // Pass pk explicitly
      // }
    } catch (err: unknown) {
      // <-- FIX: Changed any to unknown
      console.error('Wallet connection error:', err)
      // FIX: Added type checking for error message extraction
      let message = 'Connection failed'
      if (err instanceof Error) {
        message = err.message
      } else if (typeof err === 'string') {
        message = err
      }
      toast.error(`Wallet Error: ${message}`)
      setPublicKey('') // Reset public key on failure
    } finally {
      setLoadingWallet(false) // Ensure loading state is turned off
    }
  }, []) // Removed tournamentId dependency as fetch is handled by useEffect

  // --- Process Leaderboard Data (Adapt this based on your contract's return structure!) ---
  // Kept 'any' type for leaderboard/playerEntry due to complexity, relying on runtime checks.
  const processLeaderboardData = useCallback((leaderboard: unknown): PlayerScore[] => {
    // Type assertion for the expected structure
    const leaderboardData = leaderboard as { _value?: unknown[] }
    if (!leaderboardData?._value || !Array.isArray(leaderboardData._value)) {
      console.error('Invalid raw leaderboard data structure:', leaderboard)
      return []
    }

    const processedData: PlayerScore[] = []

    try {
      (leaderboard as { _value: unknown[] })._value.forEach((playerEntry: unknown, index: number) => {
        // Type assertion for the nested structure
        const entry = playerEntry as { _value?: Array<{ _attributes?: { val?: { _value?: { _value?: { _value?: Uint8Array } } } } }> }
        const playerData = entry?._value?.[0]?._attributes?.val?._value?._value?._value
        const scoreData = entry?._value?.[1]?._attributes?.val?._value

        if (playerData && scoreData !== undefined && scoreData !== null) {
          const playerAddress = convertUint8ArrayToStellarAddress(playerData)
          const playerScore = Number(scoreData)

          if (playerAddress !== 'Invalid Address' && !isNaN(playerScore)) {
            processedData.push({
              playerAddress,
              score: playerScore,
            })
          } else {
            console.warn(`Skipping invalid leaderboard entry at index ${index}: Addr=${playerAddress}, Score=${playerScore}`)
          }
        } else {
          console.warn(`Skipping entry with missing data at index ${index}:`, playerEntry)
        }
      })

      // Sort by score descending
      processedData.sort((a, b) => b.score - a.score)

      // Add rank based on sorted order
      return processedData.map((entry, idx) => ({ ...entry, rank: idx + 1 }))
    } catch (error) {
      console.error('Error processing leaderboard data:', error, '\nRaw data:', leaderboard)
      toast.error('Failed to process leaderboard data.')
      return [] // Return empty array on processing error
    }
  }, []) // No external dependencies for the processing logic itself

  // --- Leaderboard Fetching Handler ---
  const fetchBlockchainLeaderboard = useCallback(
    async (pk: string, tourId: string) => {
      if (!pk) {
        console.warn('Attempted to fetch leaderboard without public key.')
        // toast.error("Connect wallet to view leaderboard."); // Avoid redundant toast if UI handles it
        return
      }
      if (!tourId) {
        console.warn('Attempted to fetch leaderboard without tournament ID.')
        toast.error('Tournament ID missing.')
        return
      }

      console.log(`Fetching leaderboard for tournament: ${tourId}`)
      setIsFetchingLeaderboard(true)
      setBlockchainLeaderboard([]) // Clear previous results immediately

      try {
        // Call the contract function using the provided kit instance and public key
        const rawLeaderboardData = await getLeaderboard(Number(tourId), kit, pk)
        console.log('Raw Leaderboard Data Received:', rawLeaderboardData)

        // Process the data using the dedicated function
        const processed = processLeaderboardData(rawLeaderboardData)
        setBlockchainLeaderboard(processed)

        if (processed.length > 0) {
          toast.success('Leaderboard loaded!')
        } else {
          toast.success('Leaderboard loaded (currently empty).')
        }
      } catch (error: unknown) {
        // <-- FIX: Changed any to unknown
        console.error('Error fetching leaderboard:', error)
        // FIX: Added type checking for error message extraction
        let errorMessage = 'Failed to fetch leaderboard.'
        if (error instanceof Error && error.message) {
          errorMessage += ` ${error.message}`
        } else if (typeof error === 'string') {
          errorMessage = error // Handle plain string errors too
        }
        toast.error(errorMessage)
        setBlockchainLeaderboard([]) // Ensure leaderboard is empty on error
      } finally {
        setIsFetchingLeaderboard(false) // Turn off loading indicator
      }
    },
    [processLeaderboardData],
  ) // Depends on processLeaderboardData function

  // --- Score Submission Handler ---
  const handleSubmitScore = useCallback(async () => {
    // Prevent submission if critical info is missing or already submitted
    if (!tournamentId) {
      toast.error('Missing Tournament ID. Cannot submit score.')
      return
    }
    if (!publicKey) {
      toast.error('Please connect your wallet first.')
      return
    }
    if (scoreSubmitted) {
      toast.error('Score already submitted for this game session.')
      return
    }

    const scoreToSubmit = score
    console.log(`Submitting score: ${scoreToSubmit} for tournament: ${tournamentId} with wallet: ${publicKey}`)

    setIsSubmitting(true) // Indicate submission is in progress
    try {
      // Call the contract function from tournamentContract.ts
      await recordMatchResult(Number(tournamentId), kit, scoreToSubmit, publicKey)

      toast.success('Score submitted successfully!')
      setScoreSubmitted(true) // Mark as submitted for this session

      // Refresh leaderboard automatically after successful submission
      fetchBlockchainLeaderboard(publicKey, tournamentId)
    } catch (error: unknown) {
      // <-- FIX: Changed any to unknown
      console.error('Score submission error:', error)
      // FIX: Added type checking for error message extraction
      let errorMessage = 'Failed to submit score.'
      if (error instanceof Error && error.message) {
        errorMessage += ` ${error.message}`
      } else if (typeof error === 'string') {
        errorMessage = error // Handle plain string errors too
      }
      toast.error(errorMessage)
      // Optional: Allow retry on failure?
      // setScoreSubmitted(false);
    } finally {
      setIsSubmitting(false) // Submission process finished
    }
  }, [score, tournamentId, publicKey, scoreSubmitted, fetchBlockchainLeaderboard]) // Dependencies for the submission logic

  // --- Effect to fetch leaderboard when wallet connects (if tourId exists) ---
  // This runs *after* handleConnectWallet sets the publicKey or when tourId changes
  useEffect(() => {
    if (publicKey && tournamentId) {
      fetchBlockchainLeaderboard(publicKey, tournamentId)
    }
    // If the exhaustive-deps rule is properly configured, it will likely warn
    // that fetchBlockchainLeaderboard should be included here. Since it's memoized
    // with useCallback and its dependency (processLeaderboardData) is also stable,
    // adding it is safe and correct according to the rule's intent.
    // For now, the disable comment remains, assuming the rule definition is the primary issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, tournamentId]) // Consider adding fetchBlockchainLeaderboard if rule is fixed

  // --- Dynamic Text/Styles ---
  const walletButtonText = loadingWallet ? 'Connecting...' : publicKey ? `Connected: ${truncateAddress(publicKey)}` : 'Connect Wallet'

  // --- Render Component JSX ---
  // (JSX remains the same as your provided code)
  return (
    <div className="finished-canvas-ui">
      <div className="result-container">
        <div className="result-header">
          <h1>Game Over!</h1>
          <p>
            Your Score: <span>{score}</span>
          </p>
        </div>

        <div className="wallet-connect-container">
          <div className="relative">
            <button
              className={`wallet-button ${publicKey ? 'connected' : ''}`}
              onClick={() => !publicKey && setShowWallets(!showWallets)}
              disabled={loadingWallet || !!publicKey}
            >
              {walletButtonText}
            </button>

            {showWallets && !publicKey && (
              <div className="wallet-dropdown">
                {wallets.length > 0 ? (
                  wallets.map(
                    (wallet) =>
                      wallet.isAvailable && (
                        <button key={wallet.type} className="wallet-option" onClick={() => handleConnectWallet(wallet.type)} disabled={loadingWallet}>
                          <img src={wallet.icon} alt={wallet.name} />
                          <span>{wallet.name}</span>
                        </button>
                      ),
                  )
                ) : (
                  <p className="text-sm text-gray-400 p-2">No compatible wallets detected.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="leaderboard-section">
          <div className="leaderboard-header">
            <h2>Tournament Leaderboard</h2>
            <button
              onClick={() => fetchBlockchainLeaderboard(publicKey, tournamentId!)}
              className="secondary-button"
              disabled={isFetchingLeaderboard || !publicKey || !tournamentId}
              title={!publicKey ? 'Connect wallet to refresh' : !tournamentId ? 'Tournament ID missing' : 'Refresh Leaderboard'}
            >
              {isFetchingLeaderboard ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="leaderboard-content">
            {isFetchingLeaderboard ? (
              <div className="loading-state">Loading Leaderboard...</div>
            ) : blockchainLeaderboard.length > 0 ? (
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {blockchainLeaderboard.map((entry) => (
                    <tr key={entry.playerAddress}>
                      <td>#{entry.rank}</td>
                      <td title={entry.playerAddress}>{truncateAddress(entry.playerAddress)}</td>
                      <td>{entry.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">{publicKey ? 'Leaderboard is empty or unavailable.' : 'Connect wallet to view leaderboard.'}</div>
            )}
          </div>
        </div>

        <div className="action-buttons">
          <button
            onClick={handleSubmitScore}
            className="submit-button"
            disabled={isSubmitting || !publicKey || !tournamentId || scoreSubmitted}
            title={
              !publicKey ? 'Connect wallet to submit' : !tournamentId ? 'Tournament ID missing' : scoreSubmitted ? 'Score already submitted' : 'Submit Score'
            }
          >
            {isSubmitting ? 'Submitting...' : scoreSubmitted ? 'Score Submitted ✅' : 'Submit Score'}
          </button>

          <button onClick={onRestart} className="secondary-button">
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}
