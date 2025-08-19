import playersPosition from "../../utils/playersPosition"
import './PlayerCard.css'
import cardBack from '../../assets/card-back.png'
import {cardsPosition} from '../../utils/cardImagePosition.js'
import { use, useEffect, useState } from "react"
// import buttonPosition from "../../utils/buttonPosition.js"
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
  const [gameDataPlayer, setGameDataPlayer] = useState({})
  const [playerBet, setPlayerBet] = useState(player.bet || 0)
  const [lastWinnerCards, setLastWinnerCards] = useState([])
  const roomWaiting = (infoSala.roomState == 'waiting' || infoSala.roomState == 'starting')
  const isAnotherPlayer = (!playerCards && !roomWaiting)


  // setShowLastWinnerIfRoomWaiting
  useEffect(() => {
    if(infoSala.roomState == 'waiting'){
      let lastWinnerCards = gameData?.lastWinner?.userCards
      if(lastWinnerCards != undefined){
        if(gameData?.lastWinner?.username == player.username ){
          setLastWinnerCards(lastWinnerCards)
        }
      }
    }else{
      setLastWinnerCards([])
    }
  }, [gameData, infoSala.roomState, player])

  // SetPlayerBet
  useEffect(()=>{
    let userFiltered = gameData?.infoUsers?.filter(u => u.username == player.username)
    if(userFiltered != undefined){
      setPlayerBet(userFiltered[0].bet)
    }
  },[gameData, player])

  // Filtrar la data del jugador actual
  useEffect(() => {
    let gameDataPlayerFilter = gameData?.infoUsers?.filter(infoUser => infoUser.userUID == player.userUID)
    if(gameDataPlayerFilter){
      setGameDataPlayer(gameDataPlayerFilter[0])
    }   
  },[gameData,player])

  // verificamos quien es el boton
  useEffect(() => {
    if((gameData.dealerUsername == player.username) && !isDealer){
      setIsDealer(true)
    }
    if(gameData.dealerUsername != player.username){
      setIsDealer(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameData, player])


  return(
    <div 
      className={gameDataPlayer.hasFolded ? "player-card player-card--folded" : "player-card"}
      style={playersPosition[players.length][playerIndex] || {}}
      key={playerIndex} 
    >
      <p>{player.username}</p>
      {/* svg fichas */}
      <div className="player-fichas">
        <svg className='svg' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="30" fill="#388E3C" stroke="#1B5E20" strokeWidth="4"/>
          <circle cx="32" cy="32" r="20" fill="#FFFFFF"/>
          <circle cx="32" cy="32" r="10" fill="#388E3C"/>
          <path d="M32 2v8M32 54v8M2 32h8M54 32h8M11.3 11.3l5.7 5.7M47 47l5.7 5.7M11.3 52.7l5.7-5.7M47 17l5.7-5.7" stroke="#FFFFFF" strokeWidth="4"/>
        </svg>
        <p>{player.fichasInGame}</p>
      </div>

      {/* timer */}
      {
        (gameDataPlayer?.isTurn & Object.keys(gameData).length>0) ?
          <TurnTimer 
            turnInit={gameDataPlayer.turnInit}
            turnDuration={gameData.turnDuration}
          />
          :
          <></>
      }

      {/* apuestas */}
      {
        (playerBet > 0 && !roomWaiting)  &&
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

      {/* Si la sala esta waiting y hay un ganador anterior mostramos sus cartas */}
      {
        (
          infoSala.roomState == 'waiting'&& 
          lastWinnerCards.length > 0 &&
          gameData.lastWinner.username == player.username
        )? 
          <div className={gameDataPlayer.hasFolded ? "card-front--container card-front--folded" : "card-front--container"}>
            {
              lastWinnerCards.map(card => (
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
        :
          <></>
      }

      {/* cartas que vemos */}
      {
        playerCards &&
          <div className={gameDataPlayer.hasFolded ? "card-front--container card-front--folded" : "card-front--container"}>
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
          <div className={gameDataPlayer.hasFolded ? "card-back--container card-back--folded" : "card-back--container"}>
            <img src={cardBack} alt={`Cartas de ${player.username}`} />
            <img src={cardBack} alt={`Cartas de ${player.username}`} />
          </div>
      }

      {/* boton de dealer */}
      {
        (isDealer) && 
          <div 
            className="dealer-button"
            title="Boton de Dealer"
            style={
              {top: "-12px", right:"-12px"}
            }
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