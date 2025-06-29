import {useState } from "react"
import Swal from "sweetalert2"
import {joinRoom} from '../../../logic/logic.js'
import {useNavigate} from 'react-router-dom'


export default function JoinToRoomModal({
  setMoneyInGameModal,
  formToSala,
  setFormToSala,
  user
}){

  const navigate = useNavigate()
  const [rangeValue, setRangeValue] = useState(formToSala.buyInMin || formToSala.moneyInGame)

  const handleInputChange = (e) => {
    setRangeValue(e.target.value)
    setFormToSala({
      ...formToSala,
      moneyInGame: e.target.value
    })
  }

  const handleJoinRoom = () =>{
    // Verificamos que user tenga fichas necesarias
    if(formToSala.moneyInGame > user.fichas){
      Swal.fire({
        icon:"error",
        title: "No tienes tantas fichas 😥",
        text: `Solo tienes ${user.fichas} fichas, y necesitas ${formToSala.moneyInGame}`,
        background: "#222",
        color: "#fff"
      })
      return
    }

    if(formToSala.moneyInGame < formToSala.buyInMin || formToSala.moneyInGame > formToSala.buyInMax){
      Swal.fire({
        icon: "warning",
        title: "Ingrese un monto de fichas valido",
        text: `El monto debe ser entre ${formToSala.buyInMin} y ${formToSala.buyInMax} fichas`,
        background: "#222",
        color: "#fff"
      })
      return
    }

    Swal.fire({
      title: `Uniendote a ${formToSala.salaid}` ,
      text: 'Cargando par de Ases...',
      allowOutsideClick: false, 
      background: "#222",
      color: "#eee",
      didOpen: () => {
        Swal.showLoading();
      }
    });     
    const roomID = formToSala.salaid
    const buyIn = formToSala.moneyInGame
    joinRoom({user, roomID, buyIn})
      .then(res => {
        if(!res.error){
          Swal.close()
          navigate(`/sala?id=${roomID}`)
        }     
      })
      .catch(err =>{
        console.log(err)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err,
          background: "#222",
          color: "#fff"
        })
      })
  }

  return(
    <div className="sala-modal--box money-in-game--modal">
      <div className='sala-modal--exit-btn' onClick={() => {setMoneyInGameModal(false)}}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
      <path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z" fill='currentColor'/>
        </svg>
      </div>
      <p>Unirse a {formToSala.salaid}</p>
      <div className="home--header__username">
        <div style={{cursor: 'pointer'}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="#388E3C" stroke="#1B5E20" strokeWidth="4"/>
            <circle cx="32" cy="32" r="20" fill="#FFFFFF"/>
            <circle cx="32" cy="32" r="10" fill="#388E3C"/>
            <path d="M32 2v8M32 54v8M2 32h8M54 32h8M11.3 11.3l5.7 5.7M47 47l5.7 5.7M11.3 52.7l5.7-5.7M47 17l5.7-5.7" stroke="#FFFFFF" strokeWidth="4"/>
          </svg>
          {formToSala.moneyInGame}
        </div>
      </div>
      <input type="range" min={formToSala.buyInMin} step={10} max={formToSala.buyInMax} onChange={handleInputChange} value={rangeValue}/>
      <button onClick={()=>{handleJoinRoom(formToSala.salaid)}}>Unirse</button>
    </div>
  ) 
}