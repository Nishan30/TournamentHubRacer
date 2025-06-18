// src/components/FinishedMathUI.tsx

import React, { useEffect, useState, useCallback } from 'react'
import type { ISupportedWallet } from 'stellar-wallets-kit'
import { StellarWalletsKit, WalletNetwork, WalletType } from 'stellar-wallets-kit'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'

// --- Import your backend helper functions ---
import { fetchLeaderboard, updateParticipantScoreEmail } from '../helpers/UpdateScore'

// --- Import CSS ---
import './FinishedMathUI.css' // Ensure styles handle two leaderboards

// --- Type Definitions ---
interface LeaderboardEntry {
  rank: number
  name: string
  score: number
}

// Raw entry potentially returned from backend before ranking/sorting
interface RawLeaderboardEntry {
  name: string
  score: number
}

interface GoogleJWTPayload {
  email: string
  name: string
  picture: string
}

// --- Component Props Definition ---
interface FinishedMathUIProps {
  score: number
  onRestart: () => void
  tournamentId: string | null
}

// --- Wallet Kit Setup (Outside Component) ---
const kit: StellarWalletsKit = new StellarWalletsKit({
  selectedWallet: WalletType.ALBEDO, // Or remove if you want user to always choose
  network: WalletNetwork.TESTNET,
})
// Configure WalletConnect
if (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
  kit.startWalletConnect({
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string,
    name: 'Math Runner Game',
    description: 'Math Runner Score Submission',
    url: window.location.origin,
    icons: [],
  })
} else {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID not set. WalletConnect disabled.')
}

const truncateAddress = (address: string): string => {
  if (!address || address.length <= 8) return address || 'N/A'
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export const FinishedMathUI: React.FC<FinishedMathUIProps> = ({ score, onRestart, tournamentId }) => {
  // --- State Variables ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  // State for both leaderboards
  const [highScoreLeaderboard, setHighScoreLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lowScoreLeaderboard, setLowScoreLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false)
  const [publicKey, setPublicKey] = useState('')
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [showWallets, setShowWallets] = useState(false)
  const [wallets, setWallets] = useState<ISupportedWallet[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userAvatar, setUserAvatar] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [participantNotFound, setParticipantNotFound] = useState(false)

  // --- Fetch and Process Leaderboard Handler ---
  const fetchLeaderboardData = useCallback(async () => {
    if (!tournamentId) {
      setHighScoreLeaderboard([])
      setLowScoreLeaderboard([])
      return
    }
    console.log(`Fetching leaderboard for tournament: ${tournamentId}`)
    setIsFetchingLeaderboard(true)
    setHighScoreLeaderboard([]) // Clear previous results
    setLowScoreLeaderboard([]) // Clear previous results

    try {
      // Assume fetchLeaderboard returns RawLeaderboardEntry[] (name, score)
      const rawData: RawLeaderboardEntry[] = await fetchLeaderboard(tournamentId)

      if (!Array.isArray(rawData)) {
        console.error('Invalid data received from fetchLeaderboard:', rawData)
        throw new Error('Received invalid leaderboard data.')
      }

      // Process for High Scores (Sort descending)
      const sortedHigh = [...rawData] // Create a copy before sorting
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }))
      setHighScoreLeaderboard(sortedHigh)

      // Process for Low Scores (Sort ascending)
      const sortedLow = [...rawData] // Create another copy
        .sort((a, b) => a.score - b.score)
        // Only include entries with a score > 0 potentially? Or handle 0 scores if needed.
        // .filter(entry => entry.score > 0)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }))
      setLowScoreLeaderboard(sortedLow)

      console.log('High Scores:', sortedHigh)
      console.log('Low Scores:', sortedLow)
    } catch (error) {
      console.error('Error fetching or processing leaderboard:', error)
      toast.error('Failed to load leaderboard data.')
      setHighScoreLeaderboard([]) // Ensure empty on error
      setLowScoreLeaderboard([]) // Ensure empty on error
    } finally {
      setIsFetchingLeaderboard(false)
    }
  }, [tournamentId])

  // --- Load available wallets ---
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
  }, [])

  // --- Fetch leaderboard on mount/ID change ---
  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData])

  // --- Wallet Connection Handler ---
  const handleConnectWallet = useCallback(async (walletType: WalletType) => {
    try {
      setLoadingWallet(true)
      setIsAuthenticated(false) // Clear Google Auth
      setUserEmail('')
      setUserName('')
      setUserAvatar('')

      kit.setWallet(walletType)

      if (walletType === WalletType.WALLET_CONNECT) {
        await kit.connectWalletConnect()
      }

      const pk = await kit.getPublicKey()
      setPublicKey(pk)
      toast.success('Wallet connected!')
      setShowWallets(false)
    } catch (err: unknown) {
      console.error('Wallet connection error:', err)
      let message = 'Connection failed'
      if (err instanceof Error) message = err.message
      else if (typeof err === 'string') message = err
      toast.error(`Wallet Error: ${message}`)
      setPublicKey('')
    } finally {
      setLoadingWallet(false)
    }
  }, [])

  // --- Google Sign-In Success Handler ---
  const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
    try {
      const decoded = jwtDecode<GoogleJWTPayload>(credentialResponse.credential)
      setPublicKey('') // Clear Wallet connection

      setUserEmail(decoded.email)
      setUserName(decoded.name)
      setUserAvatar(decoded.picture)
      setIsAuthenticated(true)
      toast.success('Signed in with Google!')
    } catch (error) {
      console.error('Google sign-in error:', error)
      toast.error('Failed to sign in with Google')
      setIsAuthenticated(false)
      setUserEmail('')
      setUserName('')
      setUserAvatar('')
    }
  }, [])

  // --- Score Submission Handler (Remains the same logic) ---
  const handleSubmitScore = useCallback(async () => {
    if (!tournamentId) {
      toast.error('Missing Tournament ID.')
      return
    }
    if (!isAuthenticated && !publicKey) {
      toast.error('Please sign in or connect wallet.')
      return
    }
    if (scoreSubmitted) {
      toast.error('Score already submitted.')
      return
    }

    setIsSubmitting(true)
    setParticipantNotFound(false)

    const scoreToSubmit = score
    const identifier = isAuthenticated ? userEmail : publicKey

    console.log(`Submitting score: ${scoreToSubmit} for tour: ${tournamentId} ID: ${identifier}`)

    try {
      const response = await updateParticipantScoreEmail(tournamentId, identifier, scoreToSubmit)
      console.log('Score submission response:', response)

      if (response?.error === 'Participant not found') {
        toast.error('You are not registered for this tournament!', { duration: 4000 })
        setParticipantNotFound(true)
        setIsSubmitting(false) // Stop loading early
        return
      }
      if (response?.error) {
        toast.error(`Submission failed: ${response.error}`)
        setIsSubmitting(false)
        return
      }

      setScoreSubmitted(true)
      toast.success('Score submitted successfully!')
      fetchLeaderboardData() // Refresh both leaderboards
    } catch (error: unknown) {
      console.error('Score submission error:', error)
      let errorMessage = 'Failed to submit score.'
      if (error instanceof Error) errorMessage += ` ${error.message}`
      else if (typeof error === 'string') errorMessage = error
      else if (typeof error === 'object' && error !== null && 'message' in error) errorMessage = `Failed to submit score: ${error.message}`
      toast.error(errorMessage)
    } finally {
      if (!participantNotFound) {
        // Don't reset if participant not found caused early exit
        setIsSubmitting(false)
      }
    }
  }, [score, tournamentId, isAuthenticated, publicKey, userEmail, scoreSubmitted, fetchLeaderboardData, participantNotFound])

  // Determine active identifier
  const activeIdentifier = isAuthenticated ? userName : publicKey ? truncateAddress(publicKey) : ''
  const identifierType = isAuthenticated ? 'Google' : publicKey ? 'Wallet' : 'None'

  return (
    <div className="finished-math-ui bg-neutral-900 p-6 md:p-8 rounded-lg shadow-xl max-w-lg mx-auto">
      {' '}
      {/* Increased max-w slightly */}
      {/* Results Header */}
      <div className="result-header text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-4">Game Over!</h1>
        <div className="stat-box bg-neutral-800 p-4 rounded w-fit mx-auto">
          <p className="text-gray-400 text-sm">Your Score</p>
          <p className="text-3xl text-white font-semibold">{score}</p>
        </div>
      </div>
      {/* Authentication Section (Same as before) */}
      <div className="auth-section mb-6 border-t border-b border-neutral-700 py-6">
        <p className="text-gray-400 mb-3 text-center text-sm">Submit score using Google or Wallet:</p>

        {/* Google Sign-In */}
        {!isAuthenticated && (
          <div className="google-auth-container text-center mb-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Login Failed')}
                useOneTap={false}
                theme="filled_black"
                size="medium"
                shape="pill"
              />
            </div>
          </div>
        )}
        {!isAuthenticated && !publicKey && (
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-neutral-600"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-xs">OR</span>
            <div className="flex-grow border-t border-neutral-600"></div>
          </div>
        )}
        {!isAuthenticated && (
          <div className="wallet-connect-container relative">
            {' '}
            <button
              className={`wallet-button w-full py-2 px-4 rounded ${
                publicKey ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-all duration-200 ease-in-out disabled:opacity-50 flex items-center justify-center gap-2`}
              onClick={() => !publicKey && setShowWallets(!showWallets)}
              disabled={loadingWallet || !!publicKey}
            >
              {' '}
              {loadingWallet ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : publicKey ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              )}{' '}
              <span>{loadingWallet ? 'Connecting...' : publicKey ? `Wallet Connected` : 'Connect Wallet'}</span>{' '}
            </button>{' '}
            {showWallets && !publicKey && (
              <div className="wallet-options absolute z-10 mt-2 w-full bg-neutral-800 rounded-md shadow-lg p-2 border border-neutral-700 max-h-60 overflow-y-auto">
                {' '}
                {wallets.length > 0 ? (
                  wallets.map(
                    (wallet) =>
                      wallet.isAvailable && (
                        <button
                          key={wallet.type}
                          className="wallet-option flex items-center gap-3 w-full p-2 text-left hover:bg-neutral-700 rounded transition-colors duration-150 ease-in-out"
                          onClick={() => handleConnectWallet(wallet.type)}
                          disabled={loadingWallet}
                        >
                          {' '}
                          <img src={wallet.icon} alt={wallet.name} className="w-6 h-6" /> <span className="text-white text-sm">{wallet.name}</span>{' '}
                        </button>
                      ),
                  )
                ) : (
                  <p className="text-sm text-gray-400 p-2 text-center">No compatible wallets found.</p>
                )}{' '}
              </div>
            )}{' '}
          </div>
        )}
        {(isAuthenticated || publicKey) && (
          <div className="user-info flex items-center justify-center gap-2 mt-4 p-2 bg-neutral-800 rounded">
            {' '}
            {isAuthenticated && userAvatar && <img src={userAvatar} alt={userName} className="w-6 h-6 rounded-full" />}{' '}
            {publicKey && !isAuthenticated && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}{' '}
            <span className="text-white text-sm font-medium">{activeIdentifier}</span> <span className="text-xs text-gray-400">({identifierType})</span>{' '}
          </div>
        )}
        {participantNotFound && (
          <div className="mt-4 text-center">
            {' '}
            <p className="text-yellow-500 text-sm mb-2">You need to join the tournament first!</p>{' '}
            <button
              onClick={() => {
                if (tournamentId) {
                  window.open(`https://www.tournamenthub.xyz/dashboard/participant/tournaments/exploreTournament/traditional/${tournamentId}`, '_blank')
                } else {
                  toast.error('Cannot open link: Tournament ID is missing.')
                }
              }}
              className="tournament-join-button inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
              disabled={!tournamentId}
            >
              {' '}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-4-4a2 2 0 112.828-2.828L8 7.172l2.586-2.586z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M6 10a2 2 0 012.828 0l3 3a2 2 0 11-2.828 2.828l-3-3A2 2 0 016 10zm4 4a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>{' '}
              Join Tournament{' '}
            </button>{' '}
          </div>
        )}
      </div>
      {/* --- Leaderboard Area --- */}
      <div className="leaderboards-area mb-6 space-y-6">
        {' '}
        {/* Added space between leaderboards */}
        {/* High Score Leaderboard Section */}
        <div className="leaderboard-section high-scores">
          <div className="leaderboard-header flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-white">Top Scores</h2>
            {/* Refresh button can stay here, it refreshes both */}
            <button
              onClick={fetchLeaderboardData}
              className="refresh-button text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isFetchingLeaderboard || !tournamentId}
              title={!tournamentId ? 'Tournament ID missing' : 'Refresh Leaderboards'}
            >
              {isFetchingLeaderboard ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="leaderboard-content bg-neutral-800 rounded-lg overflow-hidden min-h-[150px] flex flex-col">
            {isFetchingLeaderboard ? (
              <div className="loading-state text-center text-gray-400 p-10 flex items-center justify-center">Loading...</div>
            ) : highScoreLeaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-700 text-xs text-gray-300 uppercase">
                    <tr className="border-b border-neutral-600">
                      <th className="px-4 py-2">Rank</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-200">
                    {highScoreLeaderboard.map((entry) => (
                      <tr
                        key={`high-${entry.rank}-${entry.name}`}
                        className="border-b border-neutral-700 hover:bg-neutral-750 transition-colors duration-150 ease-in-out"
                      >
                        <td className="px-4 py-2 font-medium">#{entry.rank}</td>
                        <td className="px-4 py-2">{entry.name}</td>
                        <td className="px-4 py-2 text-right font-semibold">{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state text-center text-gray-500 p-10 flex items-center justify-center">
                {tournamentId ? 'Top leaderboard is empty.' : 'No Tournament ID found.'}
              </div>
            )}
          </div>
        </div>
        {/* Low Score Leaderboard Section */}
        <div className="leaderboard-section low-scores">
          <div className="leaderboard-header flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-white">Lowest Scores</h2>
            <span className="text-xs text-yellow-400">(Potential Token Winners)</span> {/* Optional description */}
          </div>
          <div className="leaderboard-content bg-neutral-800 rounded-lg overflow-hidden min-h-[150px] flex flex-col">
            {isFetchingLeaderboard ? (
              <div className="loading-state text-center text-gray-400 p-10 flex items-center justify-center">Loading...</div>
            ) : lowScoreLeaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-700 text-xs text-gray-300 uppercase">
                    <tr className="border-b border-neutral-600">
                      <th className="px-4 py-2">Rank</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-200">
                    {lowScoreLeaderboard.map((entry) => (
                      // Ensure unique key for low score entries
                      <tr
                        key={`low-${entry.rank}-${entry.name}`}
                        className="border-b border-neutral-700 hover:bg-neutral-750 transition-colors duration-150 ease-in-out"
                      >
                        <td className="px-4 py-2 font-medium">#{entry.rank}</td>
                        <td className="px-4 py-2">{entry.name}</td>
                        <td className="px-4 py-2 text-right font-semibold">{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state text-center text-gray-500 p-10 flex items-center justify-center">
                {tournamentId ? 'Lowest score leaderboard is empty.' : 'No Tournament ID found.'}
              </div>
            )}
          </div>
        </div>
      </div>{' '}
      {/* End Leaderboards Area */}
      {/* Action Buttons (Same as before) */}
      <div className="action-buttons flex flex-col gap-3">
        {!scoreSubmitted && !participantNotFound && (
          <button
            onClick={handleSubmitScore}
            disabled={isSubmitting || (!isAuthenticated && !publicKey) || !tournamentId}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out font-semibold flex items-center justify-center gap-2"
            title={!tournamentId ? 'Tournament ID missing' : !isAuthenticated && !publicKey ? 'Sign in or connect wallet' : 'Submit your score'}
          >
            {' '}
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}{' '}
            <span>{isSubmitting ? 'Submitting...' : 'Submit Score'}</span>{' '}
          </button>
        )}
        {scoreSubmitted && (
          <div className="text-center text-green-400 font-medium p-2 bg-green-900 bg-opacity-50 rounded-md"> Score Submitted Successfully ✅ </div>
        )}
        <button
          onClick={onRestart}
          className="w-full py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors duration-150 ease-in-out font-semibold"
        >
          {' '}
          Play Again{' '}
        </button>
      </div>
    </div>
  )
}
