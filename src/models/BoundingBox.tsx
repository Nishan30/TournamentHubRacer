import { usePlane } from '@react-three/cannon'
import { useStore } from '../store'

import type { Triplet } from '@react-three/cannon'
import { useEffect, useState } from 'react'

type Props = {
  depth: number
  height: number
  position: Triplet
  width: number
}

export const BoundingBox = ({ depth, height, position: [x, y, z], width }: Props) => {
  const [reset] = useStore(({ actions: { reset } }) => [reset])
  const [showResetMessage, setShowResetMessage] = useState(false)

  // Handle collision
  const handleCollision = () => {
    setShowResetMessage(true)
  }

  // Handle key press
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r' && showResetMessage) {
        reset()
        setShowResetMessage(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [reset, showResetMessage])

  const sharedProps = {
    isTrigger: true,
    onCollide: handleCollision,
    userData: { trigger: true },
  }

  const halfDepth = depth / 2
  const halfHeight = height / 2
  const halfPi = Math.PI / 2
  const halfWidth = width / 2

  // negativeX
  usePlane(() => ({
    ...sharedProps,
    position: [x - halfWidth, y, z],
    rotation: [0, halfPi, 0],
    ...sharedProps,
  }))

  // negativeY
  usePlane(() => ({
    ...sharedProps,
    position: [x, y - halfHeight, z],
    rotation: [halfPi, 0, 0],
  }))

  // negativeZ
  usePlane(() => ({
    ...sharedProps,
    position: [x, y, z - halfDepth],
    rotation: [0, 0, 0],
  }))

  // positiveX
  usePlane(() => ({
    ...sharedProps,
    position: [x + halfWidth, y, z],
    rotation: [0, -halfPi, 0],
  }))

  // positiveY
  usePlane(() => ({
    ...sharedProps,
    position: [x, y + halfHeight, z],
    rotation: [-halfPi, 0, 0],
  }))

  // positiveZ
  usePlane(() => ({
    ...sharedProps,
    position: [x, y, z + halfDepth],
    rotation: [0, Math.PI, 0],
  }))

  return null
}
