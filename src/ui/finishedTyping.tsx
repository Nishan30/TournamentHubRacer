// components/FinishedUI.tsx
import React, { useState, useEffect } from 'react'
import { fetchLeaderboard, updateParticipantScoreEmail } from '../helpers/UpdateScore'
import toast from 'react-hot-toast'
import { StellarWalletsKit, WalletNetwork, WalletType } from 'stellar-wallets-kit'
import type { ISupportedWallet } from 'stellar-wallets-kit'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
}

interface GoogleJWTPayload {
  email: string
  name: string
  picture: string
  [key: string]: any
}

const kit: StellarWalletsKit = new StellarWalletsKit({
  selectedWallet: WalletType.ALBEDO,
  network: WalletNetwork.TESTNET,
})

// Initialize WalletConnect
kit.startWalletConnect({
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string,
  name: 'Type Racer',
  description: 'Type Racing Game',
  url: window.location.origin,
  icons: ['https://your-icon-url.com'],
})

interface FinishedUIProps {
  time: number
  typingSpeed: number
  onRestart: () => void
  tournamentId: string
}

export const FinishedUI: React.FC<FinishedUIProps> = ({ time, typingSpeed, onRestart, tournamentId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false)
  const [publicKey, setPublicKey] = useState('Wallet not Connected...')
  const [loading, setLoading] = useState(false)
  const [showWallets, setShowWallets] = useState(false)
  const [wallets, setWallets] = useState<ISupportedWallet[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState('')
  const [userAvatar, setUserAvatar] = useState('')
  const [scoreSubmitted, setScoreSubmitted] = useState(false)

  const fetchLeaderboardData = async () => {
    setIsLoadingLeaderboard(true)
    try {
      const data = await fetchLeaderboard(tournamentId)
      setLeaderboard(data)
      toast.success('Leaderboard updated!')
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      toast.error('Failed to fetch leaderboard')
    } finally {
      setIsLoadingLeaderboard(false)
    }
  }

  useEffect(() => {
    const loadWallets = async () => {
      try {
        const supported = await StellarWalletsKit.getSupportedWallets()
        setWallets(supported)
      } catch (err) {
        console.error('Error loading wallets:', err)
        toast.error('Failed to load wallets')
      }
    }
    loadWallets()
    fetchLeaderboardData()
  }, [tournamentId])

  const handleConnectWallet = async (walletType: WalletType) => {
    try {
      setLoading(true)
      kit.setWallet(walletType)
      if (walletType === WalletType.WALLET_CONNECT) {
        await kit.connectWalletConnect()
      }
      const pk = await kit.getPublicKey()
      setPublicKey(pk)
      toast.success('Wallet connected successfully!')
    } catch (err) {
      console.error('Wallet connection error:', err)
      toast.error(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setLoading(false)
      setShowWallets(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const decoded = jwtDecode<GoogleJWTPayload>(credentialResponse.credential)
      setUserEmail(decoded.email)
      setUserName(decoded.name)
      setUserAvatar(decoded.picture)
      setIsAuthenticated(true)
      toast.success('Successfully signed in with Google!')
    } catch (error) {
      console.error('Google sign-in error:', error)
      toast.error('Failed to sign in with Google')
    }
  }

  const handleSubmitScore = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in with Google first')
      return
    }
    if (publicKey === 'Wallet not Connected...') {
      toast.error('Please connect your wallet first')
      return
    }

    setIsSubmitting(true)
    try {
      await updateParticipantScoreEmail(tournamentId, userEmail, typingSpeed)
      setScoreSubmitted(true)
      toast.success('Score submitted successfully!')
      fetchLeaderboardData()
    } catch (error) {
      console.error('Score submission error:', error)
      toast.error('Failed to submit score')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="finished-ui bg-neutral-900 p-8 rounded-lg max-w-2xl mx-auto">
      {/* Results Header */}
      <div className="result-header text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Well Done! 🎉</h1>
        <div className="stats grid grid-cols-2 gap-4">
          <div className="stat-box bg-neutral-800 p-4 rounded">
            <p className="text-gray-400">Time</p>
            <p className="text-2xl text-white">{(time / 1000).toFixed(2)}s</p>
          </div>
          <div className="stat-box bg-neutral-800 p-4 rounded">
            <p className="text-gray-400">Speed</p>
            <p className="text-2xl text-white">{typingSpeed.toFixed(0)} WPM</p>
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="auth-section mb-8">
        {!isAuthenticated ? (
          <div className="google-auth-container text-center mb-4">
            <p className="text-gray-400 mb-2">Sign in to submit your score:</p>
            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Login Failed')} useOneTap />
            </div>
          </div>
        ) : (
          <div className="user-info flex items-center justify-center gap-2 mb-4">
            <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full" />
            <span className="text-white">{userName}</span>
          </div>
        )}

        {/* Wallet Connection */}
        <div className="wallet-connect-container">
          <button
            className={`wallet-button w-full py-2 rounded ${
              publicKey.startsWith('G') ? 'bg-green-600' : 'bg-blue-600'
            } text-white transition-all hover:opacity-90`}
            onClick={() => setShowWallets(!showWallets)}
            disabled={loading}
          >
            {loading ? 'Connecting...' : publicKey.startsWith('G') ? `Connected: ${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Connect Wallet'}
          </button>

          {showWallets && (
            <div className="wallet-options mt-2 bg-neutral-800 rounded p-2">
              {wallets.map(
                (wallet) =>
                  wallet.isAvailable && (
                    <button
                      key={wallet.type}
                      className="wallet-option flex items-center gap-2 w-full p-2 hover:bg-neutral-700 rounded transition-colors"
                      onClick={() => handleConnectWallet(wallet.type)}
                    >
                      <img src={wallet.icon} alt={wallet.name} className="w-6 h-6" />
                      <span className="text-white">{wallet.name}</span>
                    </button>
                  ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="leaderboard-section mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
          <button
            onClick={fetchLeaderboardData}
            disabled={isLoadingLeaderboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoadingLeaderboard ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {leaderboard.length > 0 ? (
          <div className="bg-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-300">Rank</th>
                  <th className="px-4 py-2 text-left text-gray-300">Name</th>
                  <th className="px-4 py-2 text-left text-gray-300">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="border-t border-neutral-600 hover:bg-neutral-700 transition-colors">
                    <td className="px-4 py-2 text-gray-300">#{entry.rank}</td>
                    <td className="px-4 py-2 text-gray-300">{entry.name}</td>
                    <td className="px-4 py-2 text-gray-300">{entry.score} WPM</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 bg-neutral-800 rounded-lg">No scores available yet</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons flex flex-col gap-4">
        {!scoreSubmitted && (
          <button
            onClick={handleSubmitScore}
            disabled={isSubmitting || !isAuthenticated || publicKey === 'Wallet not Connected...'}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </button>
        )}
        <button onClick={onRestart} className="w-full py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors">
          Play Again
        </button>
      </div>
    </div>
  )
}

export default FinishedUI
