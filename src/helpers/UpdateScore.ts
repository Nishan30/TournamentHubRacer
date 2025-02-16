const BASE_URL = 'http://3.145.217.76'

export const updateParticipantScoreEmail = async (tournamentId: string, email: string, score: number): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/api/tournament/participant/updateScoreEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tournamentId,
        email,
        score,
      }),
    })

    // Check for successful response
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error updating score')
    }

    // Return response JSON if successful
    const responseData = await response.json()
    return responseData
  } catch (error) {
    throw new Error('Internal Server Error')
  }
}

export const fetchLeaderboard = async (tournamentId: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/tournament/leaderboard/pointRace?tournamentId=${encodeURIComponent(tournamentId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch leaderboard')
    }

    const data = await response.json()
    return data.data // returns the leaderboard array
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    throw error
  }
}
