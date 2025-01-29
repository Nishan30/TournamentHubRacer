import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { getScores, insertScore } from '../data';
import { readableTime, Scores } from './LeaderBoard';
import { Auth } from './Auth';
import type { SavedScore } from '../data';
import { useSearchParams } from 'react-router-dom';
import { checkConnection, retrievePublicKey } from '../contract/connectWallet';
import toast from "react-hot-toast";
import { recordMatchResult } from '../contract/tournamentContract';

export const Finished = (): JSX.Element => {
  const [reset, session, time] = useStore(({ actions: { reset }, finished, session }) => [reset, session, finished]);
  const [scoreId, setScoreId] = useState<SavedScore['id']>('');
  const [scores, setScores] = useState<SavedScore[]>([]);
  const [position, setPosition] = useState<number>(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const user = session?.user?.user_metadata;
  const name: string = user?.full_name;
  const thumbnail: string = user?.avatar_url;
  const [connectStatus, setConnectStatus] = useState("Connect");
  const [publicKey, setPublicKey] = useState("Wallet not Connected...");
  const [searchParams] = useSearchParams(); // Access search params
  const scoreIdParam = searchParams.get('tourId');
  console.log(scoreIdParam);

  useEffect(() => {
    if (publicKey !== "Wallet not Connected...") {
      setConnectStatus("Connected!");
    }
  }, [publicKey]);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (await checkConnection()) {
        const pk = await retrievePublicKey();
        setPublicKey(pk);
        toast.success("Wallet connected successfully!");
      } else {
        toast.error("Failed to connect wallet.");
      }
    } catch (error) {
      toast.error("Error connecting wallet");
    }
  };

  const updatePosition = () => {
    const index = scores.findIndex((score) => score.id === scoreId);
    setPosition(index && index + 1);
  };

  const updateScores = () => {
    getScores().then(setScores);
  };

  const sendScore = async () => {
    if (!scoreIdParam) {
      toast.error("Please use a valid url.");
      return;
    }

    if (publicKey === "Wallet not Connected...") {
      toast.error("Please connect your wallet first");
      return;
    }

    let scoreCalc = (60 * 1000)/time;
    setIsRegistering(true);
    try {
      await recordMatchResult(Number(scoreIdParam),scoreCalc);
      toast.success("Successfully registered for tournament!");
      // Refresh tournament details after registration
      //handleFetchTournament();
    } catch (error) {
      toast.error("Failed to register for tournament");
    } finally {
      setIsRegistering(false);
    }
    insertScore({ name, thumbnail, time })
      .then(([{ id }]) => setScoreId(id))
      .then(updateScores)
      .then(updatePosition);
  };

  const checkLeaderboard = () => {
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
                <h3>You belong on our leaderboard, {name}! 🏆</h3>
                <button onClick={sendScore} className="submit-score-btn">
                  Submit My Score
                </button>
      </div>

      <div className="leaderboard-check">
        <button className="restart-btn" onClick={checkLeaderboard}>
          Check Leaderboard
        </button>
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