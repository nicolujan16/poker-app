import { useEffect, useState } from "react";
import './PlayerCard.css'

export default function TurnTimer({ turnInit }) {
  const [remaining, setRemaining] = useState(30);
  const turnDuration = 30 * 1000;

  useEffect(() => {
    if (!turnInit) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - turnInit;
      const remainingMs = Math.max(turnDuration - elapsed, 0);
      setRemaining(Math.ceil(remainingMs / 1000));
    }, 500);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnInit]);

  return (
    <div className="turn-timer">
      <div 
        className="turn-timer-bar"
        style={{ width: `${(remaining / 30) * 100}%` }}
      ></div>
    </div>
  );
}
