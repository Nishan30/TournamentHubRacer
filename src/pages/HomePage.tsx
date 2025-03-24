import React from 'react'
import { Gamepad2, Trophy, Users, Rocket, MessageSquare, TrendingUp, Clock, Medal, BirdIcon } from 'lucide-react'

import './HomePage.css'

export const HomePage = (): JSX.Element => {
  const games = [
    {
      title: 'Car Racer',
      description: 'Race against time in this thrilling car racing game',
      icon: <Rocket className="w-8 h-8 text-blue-500" />,
      path: '/car-racer',
      players: '2.3k',
      difficulty: 'Medium',
    },
    {
      title: 'Type Racer',
      description: 'Test your typing speed and accuracy',
      icon: <Clock className="w-8 h-8 text-green-500" />,
      path: '/type-racer',
      players: '1.8k',
      difficulty: 'Easy',
    },
    {
      title: 'Flappy Bird',
      description: 'Help the bird fly through the obstacles',
      icon: <BirdIcon className="w-8 h-8 text-green-500" />,
      path: '/flappy-bird',
      players: '1.8k',
      difficulty: 'Easy',
    },
  ]

  const tournamentHubUrl = 'https://www.tournamenthub.xyz' // Replace with actual URL

  return (
    <div className="homepage">
      {/* Hero Section */}
      <div className="hero">
        <div className="container">
          <h1 className="hero-title">Welcome to Tournament Hub Games</h1>
          <p className="hero-description">Your ultimate destination for competitive gaming and tournaments</p>
          <div className="button-group">
            <a href={tournamentHubUrl} className="button button-primary">
              <Trophy className="w-5 h-5 mr-2" />
              Find Tournaments
            </a>
            <a href={`${tournamentHubUrl}/signin`} className="button button-secondary">
              <Medal className="w-5 h-5 mr-2" />
              Participate & Win
            </a>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="games-section">
        <div className="container">
          <h2 className="section-title">Featured Games</h2>
          <p className="section-description">Choose your game and start competing</p>
          <div className="games-grid">
            {games.map((game) => (
              <a key={game.title} href={game.path} className="game-card">
                <div className="game-header">
                  <div className="game-icon">{game.icon}</div>
                  <div className="game-stats">
                    <Users className="w-4 h-4" />
                    <span>{game.players} playing</span>
                  </div>
                </div>
                <h3 className="game-title">{game.title}</h3>
                <p className="game-description">{game.description}</p>
                <div className="game-footer">
                  <span className="game-difficulty">Difficulty: {game.difficulty}</span>
                  <span className="game-link">Play Now →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <TrendingUp className="feature-icon w-10 h-10 text-purple-500" />
              <h3 className="feature-title">Leaderboards</h3>
              <p className="feature-description">Compete globally and track your rankings</p>
            </div>
            <div className="feature-card">
              <Trophy className="feature-icon w-10 h-10 text-yellow-500" />
              <h3 className="feature-title">Daily Tournaments</h3>
              <p className="feature-description">Join tournaments and win exciting prizes</p>
            </div>
            <div className="feature-card">
              <MessageSquare className="feature-icon w-10 h-10 text-green-500" />
              <h3 className="feature-title">Community</h3>
              <p className="feature-description">Connect with fellow gamers worldwide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div>
              <div className="stat-value">10K+</div>
              <div className="stat-label">Active Players</div>
            </div>
            <div>
              <div className="stat-value">500+</div>
              <div className="stat-label">Daily Tournaments</div>
            </div>
            <div>
              <div className="stat-value">$50K</div>
              <div className="stat-label">Prize Pool</div>
            </div>
            <div>
              <div className="stat-value">2+</div>
              <div className="stat-label">Games</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <Gamepad2 className="w-8 h-8" />
              <span>Tournament Hub Games</span>
            </div>
            <div className="footer-copyright">© 2024 Tournament Hub Games. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
