import playersPosition from "../../utils/playersPosition"
import './PlayerCard.css'
import cardBack from '../../assets/card-back.png'
import {cardsPosition} from '../../utils/cardImagePosition.js'
import { useEffect, useState } from "react"
import buttonPosition from "../../utils/buttonPosition.js"
import TurnTimer from "./TurnTimer.jsx"
import playersBetPosition from "../../utils/playersBetPosition.js"


export default function PlayerCard({
  players, 
  player, 
  playerIndex,
  playerCards,
  infoSala,
  gameData
}){
  const [isDealer, setIsDealer] = useState(false)
  const [playerBet, setPlayerBet] = useState(0)
  
  // verificamos quien es el boton
  if((gameData.dealerUsername == player.username) && !isDealer){
    setIsDealer(true)
  }

  const roomWaiting = infoSala.roomState == 'waiting'

  useEffect(() => {
    if(Object.keys(gameData).length > 0){
      const filtered = gameData.bets.filter(bet => bet.username == player.username)
      setPlayerBet(Number(filtered[0].amount))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[gameData.bets])



  const isAnotherPlayer = (!playerCards && !roomWaiting)

  return(
    <div 
      className="player-card"
      style={playersPosition[players.length][playerIndex] || {}}
      key={playerIndex} 
    >
      <p>{player.username}</p>
      <p>{player.fichasInGame}</p>

      {/* timer */}
      {
        player.isTurn && <TurnTimer turnInit={player.turnInit}/>
      }

      {/* apuestas */}
      {
        playerBet > 0 &&
          <div className="player-bet"
            style={playersBetPosition[players.length][playerIndex]}
          >
            <div className="player-bet-svg">
              <svg className='svg' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" fill="#388E3C" stroke="#1B5E20" strokeWidth="4"/>
                <circle cx="32" cy="32" r="20" fill="#FFFFFF"/>
                <circle cx="32" cy="32" r="10" fill="#388E3C"/>
                <path d="M32 2v8M32 54v8M2 32h8M54 32h8M11.3 11.3l5.7 5.7M47 47l5.7 5.7M11.3 52.7l5.7-5.7M47 17l5.7-5.7" stroke="#FFFFFF" strokeWidth="4"/>
              </svg>
            </div>
            <p>
              {playerBet}
            </p>
          </div>
      }

      {/* cartas que vemos */}
      {
        playerCards &&
          <div className="card-front--container">
            {
              playerCards.map(card => (
                <div
                key={card}
                className="card-front"
                style={{
                  ...cardsPosition[card] 
                }}
                ></div>
              ))        
            }
          </div>
      }

      {/* cartas que no vemos */}
      {
        (isAnotherPlayer) &&
          <div className="card-back--container">
            <img src={cardBack} alt={`Cartas de ${player.username}`} />
            <img src={cardBack} alt={`Cartas de ${player.username}`} />
          </div>
      }

      {/* boton de dealer */}
      {
        isDealer && 
          <div 
            className="dealer-button"
            title="Dealer Button"
            style={buttonPosition[players.length][playerIndex] || {}}
          >B</div>
      }

      {/* Admin tag */}
      {
        player.isAdmin && 
        <div className="admin-tag" title="Administrador de la sala">A</div>
      }   

      
    </div>
  )
}