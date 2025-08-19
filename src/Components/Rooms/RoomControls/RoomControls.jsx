import { useEffect, useRef, useState } from "react"
import './RoomControls.css'
import { userAction } from "../../../logic/engine"

export default function RoomControls({infoSala, user, gameData}){

  const [betBar, setBetBar] = useState(infoSala.smallBlind)
  const [ourBet, setOurBet] = useState(0)
  const [isTurn, setIsTurn] = useState(false)
  const [fichasRestantes, setFichasRestantes] = useState()
  let hasBet = gameData.hasBet || false

  // Bet bar scroll function
  const betBarRef = useRef()
  useEffect(() => {
    const handleScroll = (e) => {
      e.preventDefault()
      if (!isTurn) return

      const delta = Math.sign(e.deltaY)
      setBetBar(prev => {
        let newValue = delta > 0 ? prev - 5 : prev + 5
        newValue = Math.max(infoSala.smallBlind, Math.min(fichasRestantes, newValue))
        return newValue
      })
    }

    const betbar = betBarRef.current
    if (betbar) {
      betbar.addEventListener('wheel', handleScroll, { passive: false })
    }

    return () => {
      if (betbar) {
        betbar.removeEventListener('wheel', handleScroll)
      }
    }
  }, [isTurn, infoSala.smallBlind, fichasRestantes])

  // Verify turn
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

  // setFichasRestantes
  useEffect(() => {
    let player = gameData?.infoUsers?.filter((u) => {
      return u.username == user.username
    })
    if(player){
      setFichasRestantes(player[0].fichasInGame)
    }

  },[gameData, user])

  // Settear ourBet
  useEffect(()=>{
    let userIndex = gameData.infoUsers?.findIndex(u => u.username == user.username)
    if(userIndex != undefined && userIndex != -1){
      setOurBet(gameData?.infoUsers[userIndex]?.bet || 0)
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
            (hasBet && gameData.currentBet != ourBet) ?
            <>
              <button 
                disabled={!isTurn}
                onClick={handleAction}
              >
                {
                  user.fichasInGame < gameData.currentBet ?
                  `Call ${gameData.infoUsers.filter(u=>u.username == user.username)[0].fichasInGame}`:
                  `Call ${Number(gameData.currentBet) - ourBet}`
                }
              </button>
  
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
            <input 
              disabled={!isTurn}
              type="range"
              name="bet-bar" 
              id="bet-bar" 
              min={infoSala.smallBlind} 
              max={fichasRestantes}
              onChange={handleBetChange} 
              value={betBar}
              step={5}
              ref={betBarRef}  
            />
          </div>
        </div>
      </div>
    </div>
  )
}