import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { getScores, insertScore } from '../data';
import { readableTime, Scores } from './LeaderBoard';
import { Auth } from './Auth';
import type { SavedScore } from '../data';

export const Finished = (): JSX.Element => {
  const [reset, session, time] = useStore(({ actions: { reset }, finished, session }) => [reset, session, finished]);
  const [scoreId, setScoreId] = useState<SavedScore['id']>('');
  const [scores, setScores] = useState<SavedScore[]>([]);
  const [position, setPosition] = useState<number>(0);

  const isAuthenticated = session?.user?.aud === 'authenticated';

  const user = session?.user?.user_metadata;
  const name: string = user?.full_name;
  const thumbnail: string = user?.avatar_url;

  const updatePosition = () => {
    const index = scores.findIndex((score) => score.id === scoreId);
    setPosition(index && index + 1);
  };

  const updateScores = () => {
    getScores().then(setScores);
  };

  const sendScore = () => {
    insertScore({ name, thumbnail, time })
      .then(([{ id }]) => setScoreId(id))
      .then(updateScores)
      .then(updatePosition);
  };

  useEffect(updateScores, [time]);
  useEffect(updatePosition, [scoreId, scores]);

  return (
    <div className="finished">
      {/* Header Section */}
      <div className="finished-header">
        <h1>Good job! 🎉</h1>
        <p>Your time was <span className="time">{readableTime(time)}</span> seconds</p>
      </div>

      {/* Leaderboard Section */}
      <div className="finished-leaderboard">
        <h2>Leaderboard</h2>
        <Scores className="leaderboard" scores={scores} />
      </div>

      {/* Authentication and Score Submission Section */}
      <div className="finished-auth">
        {isAuthenticated ? (
          <>
            {scoreId ? (
              position ? (
                <h3>You are number <span className="position">#{position}</span> on the leaderboard!</h3>
              ) : null
            ) : (
              <>
                <h3>You belong on our leaderboard, {name}! 🏆</h3>
                <button onClick={sendScore} className="submit-score-btn">
                  Submit My Score
                </button>
              </>
            )}
          </>
        ) : (
          <Auth />
        )}
      </div>

      {/* Restart Button */}
      <div className="finished-restart">
        <button className="restart-btn" onClick={reset}>
          Restart Game
        </button>
      </div>
    </div>
  );
};