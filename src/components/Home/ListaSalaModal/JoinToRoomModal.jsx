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
  const [showPassword, setShowPassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

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
    let password = passwordInput
    joinRoom({user, roomID, buyIn, password})
      .then(res => {
        if(res.error){
          throw new Error(res.message)
        }
        if(!res.error){
          Swal.close()
          navigate(`/sala?id=${roomID}`)
        }     
      })
      .catch(err =>{
        Swal.fire({
          icon: "error",
          title: err,
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
      {
        formToSala.isPrivate &&
        <div className="join-room-modal--input-password-container">
          <p>Ingrese contraseña:</p>
          <div>
          <input 
            type={showPassword ? 'text' : 'password'} 
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value) }
          />
          {
            showPassword ?
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"
              fill="white"
              onClick={() => setShowPassword(prevState => !prevState)}  
            >
              <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/>
            </svg>
            :
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" 
              fill="white"
              onClick={() => setShowPassword(prevState => !prevState)}  
              >
              <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z"/>
              </svg>
        }
          </div>
        </div>
      }
      <button onClick={()=>{handleJoinRoom(formToSala.salaid)}}>Unirse</button>
    </div>
  ) 
}