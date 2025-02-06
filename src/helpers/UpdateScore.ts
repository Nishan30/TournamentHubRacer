const BASE_URL = 'https://www.tournamenthub.xyz/api/tournament/participant'

export const updateParticipantScoreEmail = async (tournamentId: string, email: string, score: number): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/updateScoreEmail`, {
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
