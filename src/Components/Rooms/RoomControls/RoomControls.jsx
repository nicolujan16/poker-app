import { useEffect, useState } from "react"
import './RoomControls.css'
import { userAction } from "../../../logic/engine"

export default function RoomControls({infoSala, user, gameData}){

  const [betBar, setBetBar] = useState(infoSala.smallBlind)
  const [ourBet, setOurBet] = useState(0)
  const [isTurn, setIsTurn] = useState(false)
  const [fichasRestantes, setFichasRestantes] = useState()
  const [hasBet, setHasBet] = useState(false)

  useEffect(() => {
    if(gameData?.currentBet == ourBet && gameData.hasBet){
      setHasBet(false)
      return
    }else{
      setHasBet(gameData.hasBet)
    }
  },[gameData, ourBet])

  useEffect(() =>{
    let playerTurn = gameData?.infoUsers?.filter(p => p.isTurn)
    if(playerTurn?.length > 0){
      if(playerTurn[0].username == user?.username){
        setIsTurn(true)
      }else{
        setIsTurn(false)
      }
    }
  },[gameData.infoUsers, user])

  useEffect(() => {
    if(gameData?.bets?.length > 0){
      let filteredBet = gameData.bets?.filter(bet => {
        return bet.username == user.username
      })
      if(filteredBet?.length > 0){        
        setOurBet(filteredBet[0].amount)
      }
    }
  },[gameData, user])

  useEffect(() => {
    let player = gameData?.infoUsers?.filter((u) => {
      return u.username == user.username
    } )
    if(player){
      setFichasRestantes(player[0].fichasInGame)
    }

  },[gameData, user])

  const handleBetChange = (e) => {
    e.preventDefault()
    let valor
    if(e.target.innerText == 'All-In'){
      valor = fichasRestantes
    }else{
      valor = Number(e.target.value)
    }
    setBetBar(valor)
  }

  const handleAction = (e) => {
    if(e.target.innerText == 'Fold'){
      console.log("Foldeado")
      userAction({
        roomID: infoSala.nombreSala,
        action: 'Fold'
      })
        .then(res => console.log(res))
      return
    }
    let action = e.target.innerText.split(" ")[0]
    let monto = e.target.innerText.split(" ")[1]

    if(action == 'Raise'){
      monto = monto - ourBet
      console.log(monto)
    }

    userAction({
      roomID: infoSala.nombreSala,
      action,
      amount: monto
    })
      .then(res => console.log(res))
  }

  const handleBetBarInputChange = (e) => {
    e.preventDefault()
    if(e.target.value.length > 7){
      return
    }
    setBetBar(e.target.value)
  }

  return(
    <div className="room-controls--container">
      <div className="room-controls--box">
        <div className="room--controls--action-btns">
          <div>
          {
            hasBet ?
            <>
              <button disabled={!isTurn} onClick={handleAction}>Call {Number(gameData.currentBet) - ourBet}</button>
   
              <button disabled={!isTurn || gameData.currentBet >= betBar} onClick={handleAction}>Raise {betBar}</button>
            
          
            </>
            :
            <>
              <button disabled={!isTurn} onClick={handleAction}>Check</button>
              <button disabled={!isTurn} onClick={handleAction}>Bet {betBar}</button>
            </>
          }
          <button disabled={!isTurn} onClick={handleBetChange} className="room-control--all-in--btn">All-In</button>
          <button disabled={!isTurn} onClick={handleAction}
          className="room-control--fold--btn"
          >Fold</button>
          </div>
          <div className="room-controls--bet-bar">
            <input type="number" value={betBar} onChange={handleBetBarInputChange}/>
            <input disabled={!isTurn} type="range" name="bet-bar" id="bet-bar" 
            min={infoSala.smallBlind} max={fichasRestantes}
            onChange={handleBetChange} value={betBar} step={5}/>
          </div>
        </div>
      </div>
    </div>
  )
}