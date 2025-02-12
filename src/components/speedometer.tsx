import React, { useEffect, useRef } from 'react'
import './Speedometer.css'

interface SpeedometerProps {
  speed: number
}

const Speedometer: React.FC<SpeedometerProps> = ({ speed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const getSpeedCategory = (speed: number) => {
    if (speed > 80) return { label: 'INSANE!', color: '#9333ea', glow: '#a855f7' }
    if (speed > 60) return { label: 'FAST!', color: '#2563eb', glow: '#3b82f6' }
    if (speed > 40) return { label: 'GOOD', color: '#16a34a', glow: '#22c55e' }
    if (speed > 20) return { label: 'WARMING UP', color: '#ca8a04', glow: '#eab308' }
    return { label: 'ROOKIE', color: '#dc2626', glow: '#ef4444' }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up speedometer properties
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Draw outer ring
    const gradient = ctx.createRadialGradient(centerX, centerY, radius - 20, centerX, centerY, radius)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)')

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw speed indicator
    const maxSpeed = 100
    const startAngle = Math.PI * 0.8
    const endAngle = Math.PI * 2.2
    const speedAngle = startAngle + (endAngle - startAngle) * (Math.min(speed, maxSpeed) / maxSpeed)

    const { color, glow } = getSpeedCategory(speed)

    // Draw speed arc
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 20, startAngle, speedAngle)
    ctx.lineWidth = 10
    ctx.strokeStyle = color
    ctx.lineCap = 'round'
    ctx.shadowColor = glow
    ctx.shadowBlur = 15
    ctx.stroke()

    // Reset shadow for text
    ctx.shadowBlur = 0

    // Draw speed text
    ctx.font = 'bold 48px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(Math.round(speed).toString(), centerX, centerY - 10)

    // Draw "WPM" text
    ctx.font = '16px Inter, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillText('WPM', centerX, centerY + 20)
  }, [speed])

  const { label, color } = getSpeedCategory(speed)

  return (
    <div className="speedometer-container">
      <canvas ref={canvasRef} width={200} height={200} className="speedometer-canvas" />
      <div className="speed-category" style={{ color }}>
        {label}
      </div>
    </div>
  )
}

export default Speedometer
