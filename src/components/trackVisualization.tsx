import React, { useState, useEffect } from 'react'
import { Flame } from 'lucide-react'
import './TrackVisualization.css'

interface TrackVisualizationProps {
  progress: number
}

const TrackVisualization: React.FC<TrackVisualizationProps> = ({ progress }) => {
  const [carPosition, setCarPosition] = useState(0)

  useEffect(() => {
    setCarPosition(progress * 100)
  }, [progress])

  return (
    <div className="track-container">
      <div className="track">
        <div className="track-lines"></div>
        <div className="track-glow"></div>
        <div className="lane-markers">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="lane-marker"></div>
          ))}
        </div>
        <div className="finish-line">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="checker"></div>
          ))}
        </div>
        <div className="car" style={{ left: `${carPosition}%` }}>
          🏎️
        </div>
      </div>
    </div>
  )
}

export default TrackVisualization
