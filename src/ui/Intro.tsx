import { Suspense, useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import type { ReactNode } from 'react'
import { useStore } from '../store'
import { setupSession } from '../data'
import { Keys } from './Keys'

export function Intro({ children }: { children: ReactNode }): JSX.Element {
  const [clicked, setClicked] = useState(false)
  const [loading, setLoading] = useState(true)
  const { progress } = useProgress()
  const [set] = useStore((state) => [state.set])

  useEffect(() => {
    if (clicked && !loading) set({ ready: true })
  }, [clicked, loading])

  useEffect(() => {
    if (progress === 100) setLoading(false)
  }, [progress])

  useEffect(() => {
    setupSession(set)
  }, [])

  return (
    <>
      <Suspense fallback={null}>{children}</Suspense>
      <div className={`fullscreen bg ${loading ? 'loading' : 'loaded'} ${clicked && 'clicked'}`}>
        <div className="stack">
          {/* Title and Car Icons */}
          <div className="title-container">
            <h1 className="title">Tournament Hub Racer</h1>
            <div className="car-icons">
              <span role="img" aria-label="car">
                🏎️
              </span>
              <span role="img" aria-label="car">
                🚗
              </span>
              <span role="img" aria-label="car">
                🚙
              </span>
            </div>
          </div>

          {/* Click-to-Start Link */}
          <div className="start-container">
            <a className="start-link" href="#" onClick={() => setClicked(true)}>
              {loading ? `Loading ${progress.toFixed()}%` : 'Click to Start'}
            </a>
          </div>

          {/* Keys Section (Moved to the Right) */}
          <div className="keys-container">
            <Keys style={{ paddingBottom: 20 }} />
          </div>

          {/* Authentication Section (Commented Out) */}
          {/* {session?.user?.aud !== 'authenticated' ? (
            <Auth />
          ) : (
            <div>
              Hello {session.user.user_metadata.full_name}
              <button className="logout" onClick={unAuthenticateUser}>
                Logout
              </button>{' '}
            </div>
          )} */}
        </div>

        {/* Footer (Commented Out) */}
        {/* <Footer
          date="2. June"
          year="2021"
          link1={<a href="https://github.com/pmndrs/react-three-fiber">@react-three/fiber</a>}
          link2={<a href="https://github.com/pmndrs/racing-game">/racing-game</a>}
        /> */}
      </div>
    </>
  )
}
