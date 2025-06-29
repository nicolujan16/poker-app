import { useState } from "react"
import './RoomControls.css'

export default function RoomControls({infoSala, players}){
  const [gameState, setGameState] = useState({
    hasBet: true,
    canCheck: true,
    callAmount: 2000,
    raiseTo: 2000*2,
    isAllInAvailable: true
  })
  const [betBar, setBetBar] = useState(infoSala.smallBlind)
  const [fichasRestantes, setFichasRestantes] = useState(2000)

  const handleBetChange = (e) => {
    e.preventDefault()
    const valor = Number(e.target.value)
    setBetBar(valor)
  }

  return(
    <div className="room-controls--container">
      <div className="room-controls--box">
        <div className="room-controls--bets-btn">
        </div>
        <div className="room--controls--action-btns">
          {gameState.hasBet ?
            <>
              <button>Fold</button>
              <button>Call</button>
              <button>Raise</button>
            </>
          :
            <>
              <button>Check</button>
              <button>Bet {betBar}</button>
            </>
          }
          <button>All-In</button>
          <div className="room-controls--bet-bar">
            <label htmlFor="bet-bar">{betBar}</label>
            <input type="range" name="bet-bar" id="bet-bar" 
            min={infoSala.smallBlind} max={fichasRestantes}
            onChange={handleBetChange} value={betBar} step={5}/>
          </div>
        </div>
      </div>
    </div>
  )
}