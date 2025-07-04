import { useEffect, useState } from "react"
import {auth, RTDB} from "../../firebaseConfig"
import {onAuthStateChanged } from "firebase/auth"
import { useNavigate, useSearchParams } from "react-router-dom"
import { getUsername } from "../../validation/validations"
import './Sala.css'
import RoomControls from "./RoomControls/RoomControls"
import Swal from "sweetalert2"
import {leaveSala, eliminarSala } from "../../logic/logic.js"
import { off, onValue, ref } from "firebase/database"
import PlayerCard from "./PlayerCard.jsx"
import { startGame } from "../../logic/engine.js"

export default function Sala(){
  const navigate = useNavigate()
 
  const [user, setUser] = useState({})
  const [loadingData, setLoadingData] = useState(true)
  const [searchParams] = useSearchParams();
  const [players, setPlayers] = useState([])
  const [infoSala, setInfoSala] = useState({})
  const [gameData, setGameData] = useState({})
  const [playerCards, setPlayerCards] = useState(null);

  const isAdmin = user?.username === infoSala?.admin;

  // suscribir a RTDB:Cards
  useEffect(() => {
    if (!infoSala.nombreSala || infoSala.roomState == 'waiting' || !user || loadingData) return;

    try{
      const gameDataRef = ref(RTDB, `salas/${infoSala.nombreSala}/usersCards/${user.uid}`);
      
      // Suscribirse a CARTAS
      const unsubscribe = onValue(gameDataRef, (snapshot) => {
        const data = snapshot.val();
        setPlayerCards(data);
      });
      
      // Cleanup: desuscribirse
      return () => {
        off(gameDataRef, "value", unsubscribe);
      };
    }catch(err){
      Swal.fire({
        title: "Error obteniendo cartas",
        text: err,
        background: "#222",
        color: "#fff"
      })
    }


  }, [infoSala, user, loadingData]);

  // obtener user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/')
      } else {
        getUsername(user)
          .then((response) => {
            if (response.uid) {
              setUser({ ...response })
            } else {
              setUser(null)
            }
          })
      }
    })

    return () => unsubscribe()
  }, [navigate])

  // suscribir a RTDB:Sala
  useEffect(() => {
    const salaID = searchParams.get('id')
    if (!salaID) {
      navigate('/')
      return
    }

    // Referencia a publicData
    const publicDataRef = ref(RTDB, `salas/${salaID}/publicData`)

    const unsubscribe = onValue(publicDataRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setInfoSala(data)
        setPlayers(data.users || [])
      } else {
        // Si la sala no existe
        Swal.fire({
          icon: "error",
          title: "Sala no encontrada",
          text: "La sala que intentas acceder no existe o fue eliminada.",
          showConfirmButton: true,
          confirmButtonText: "Volver al lobby",
          background: "#222",
          color: "#fff"
        }).then(() => navigate('/home'))
      }
    }, (error) => {
      console.error(error)
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con la sala.",
        background: "#222",
        color: "#fff"
      })
      setLoadingData(false)
    })

    // Cleanup
    return () => {
      off(publicDataRef, 'value', unsubscribe)
    }
  }, [searchParams, navigate])

  // // suscribir a RTDB:GameData
   useEffect(() => {
    const salaID = searchParams.get('id')
    if (!salaID) {
      navigate('/')
      return
    }
    // Referencia a gameData
    const gameDataRef = ref(RTDB, `salas/${salaID}/gameData`)

    const unsubscribe = onValue(gameDataRef, (snapshot) => {
      let dataGame = snapshot.val()
      if (dataGame) {
        setGameData(dataGame)
      }
    }, (error) => {
      console.error(error)
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con la sala.",
        background: "#222",
        color: "#fff"
      })
    })

    // Cleanup
    return () => {
      off(gameDataRef, 'value', unsubscribe)
    }
  }, [searchParams, navigate, infoSala.roomState])

  // Ordenar jugadores para que nosotros estemos abajo al medio siempre
  useEffect(() => {
    if (!players || players.length === 0 || !user) {
      return
    };
    
    const index = players.findIndex(p => p.userUID === user.uid);
    if(index == -1) return

    if(index !== 0){
      const jugadoresOrdenados = [
        ...players.slice(index),
        ...players.slice(0, index)
      ]

      setPlayers(jugadoresOrdenados)
    }
    setLoadingData(false)

  }, [players, user]);

  if (loadingData) {
    return <div className='loading-spinner--container'>
      <div className="loading-spinner"></div>
      <p>Cargando datos...</p>
    </div>;
  }

  const handleBackToLobby = async (e) => {
    if(isAdmin){
      Swal.fire({
        title: "Estas seguro que desea salir?",
        text: "La sala actual sera eliminada",
        showConfirmButton: true,
        showDenyButton: true,
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        confirmButtonText: "Salir y eliminar sala",
        denyButtonText: `Salir y mantener sala`,
        background: "#222",
        color: "#fff"
      }).then((result) => {
        if (result.isConfirmed) { 
          Swal.fire({
            title: 'Eliminando sala...',
            text: 'Por favor espera',
            allowOutsideClick: false, 
            background: "#222",
            color: "#eee",
            didOpen: () => {
              Swal.showLoading();
            }
          });     
          eliminarSala({roomName: infoSala.nombreSala})
            .then(() => {
              Swal.close({})
              Swal.fire({
                title: "Sala eliminada",
                showConfirmButton: true,
                showCancelButton: false,
                confirmButtonText: "Volver al lobby",
                background: "#222",
                color: "#fff"
              }).then(result => {
                if(result.isConfirmed){
                  navigate('/home')
                }
              })
            })
            .catch(err=>{
              Swal.fire({
                title: "Error eliminando sala",
                text: err.message,
                background: "#222",
                color: "#fff"
              })
            })
        }
        if(result.isDenied){
          navigate('/home')
        }
        
      });
    }else{
      Swal.fire({
        title: "Estas seguro que desea salir?",
        showDenyButton: true,
        confirmButtonText: "Salir",
        denyButtonText: `No Salir`,
        background: "#222",
        color: "#fff"
      }).then((result) =>{
        if(result.isConfirmed){
          Swal.fire({
            title: `Saliendo de sala` ,
            text: 'Juntando fichas...',
            allowOutsideClick: false, 
            background: "#222",
            color: "#eee",
            didOpen: () => {
              Swal.showLoading();
            }
          });    
          let roomID = infoSala.nombreSala
          leaveSala({roomID})
            .then(data => {
              if(data.status == 200){
                Swal.close({})
                navigate('/home')
              }else{
                Swal.close({})
                Swal.fire({
                  icon:"error",
                  title: "Error saliendo de la sala",
                  text: data.message,
                  background: "#222",
                  color: "#fff"
                })
              }
            })
        }
      })
    }
    e.preventDefault()
  }

  const handleStartGame = async (e) => {
    e.preventDefault()
    // FUNCION PARA INICIAR SALA...
    startGame({
      roomID: infoSala.nombreSala
    })
    .then(data => {
      if(data.status != 200){
        Swal.fire({
          title: "Error iniciando juego. Intente nuevamente.",
          text: data.message,
          icon: "error",
          background: "#222",
          color: "#fff"
        })
      }
    }
    )
  }

  return(
    <div className="room--container">
      <button title="Volver al lobby" className="back-to-lobby--btn" onClick={handleBackToLobby}> 
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
          <path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/>
        </svg>
      </button>
      <div className="main-table--container">
        {
          players.map((player, playerIndex) => (
            <PlayerCard
              key={playerIndex}
              players={players}
              player={player}
              playerIndex={playerIndex}
              playerCards={playerIndex === 0 ? playerCards : false}
              infoSala={infoSala}
              gameData={gameData || false}
            />
        ))}
      </div>
      {/* ----RoomState: waiting---- */}
      {
        infoSala.roomState == 'waiting' &&
        <div className="room-waiting-players--container">
          <div className="room-waiting-players--box">
             <p>

                {
                  infoSala?.users?.length == infoSala?.maxPlayers ?
                    <>Esperando admin para iniciar partida</>
                    :
                    <>
                    Esperando jugadores... {infoSala.users.length}/{infoSala.maxPlayers} 
                    </>
                
                }
             </p> 
            {
              (infoSala.users.length > 1 & isAdmin) ?
              <button onClick={handleStartGame}>Comenzar partida</button>
              :
              ''
            }
          </div>
        </div>
      }
      {/* ----RoomState: preflop---- */}
      {
        infoSala.roomState !== 'waiting' &&
          <RoomControls 
          infoSala={infoSala}
          players={players}
          user={user}
          />
      }
    </div>
  )
}