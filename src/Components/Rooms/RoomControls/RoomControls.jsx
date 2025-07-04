import { useState } from "react"
import './RoomControls.css'

export default function RoomControls({infoSala, user}){

  const [betBar, setBetBar] = useState(infoSala.smallBlind)
  const [hasBet, setHasBet] = useState(false)

  const handleBetChange = (e) => {
    e.preventDefault()
    let valor
    if(e.target.innerText == 'All-In'){
      valor = Number(user.fichasInGame)
    }else{
      valor = Number(e.target.value)
    }
    setBetBar(valor)
  }

  const handleAction = () => {
    
  }

  return(
    <div className="room-controls--container">
      <div className="room-controls--box">
        <div className="room-controls--bets-btn">
        </div>
        <div className="room--controls--action-btns">
          <div>

          {
            hasBet ?
            <>
              <button>Call</button>
              <button>Raise</button>
            </>
            :
            <>
              <button>Check</button>
              <button>Bet {betBar}</button>
            </>
          }
          <button onClick={handleBetChange}>All-In</button>
          <button>Fold</button>
          </div>
          <div className="room-controls--bet-bar">
            <label htmlFor="bet-bar">{betBar}</label>
            <input type="range" name="bet-bar" id="bet-bar" 
            min={infoSala.smallBlind} max={user.fichasInGame}
            onChange={handleBetChange} value={betBar} step={5}/>
          </div>
        </div>
      </div>
    </div>
  )
}