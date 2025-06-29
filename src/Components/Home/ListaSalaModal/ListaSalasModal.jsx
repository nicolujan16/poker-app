import { useEffect, useState} from "react"
import './ListaSalasModal.css' 
import { db } from "../../../firebaseConfig.js"
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import JoinToRoomModal from "./JoinToRoomModal.jsx";

async function obtenerSalasDisponibles() {
  try {
    const querySnapshot = await getDocs(collection(db, "Salas"));

    if (querySnapshot.empty) {
      return [];
    }

    const salas = querySnapshot.docs.map(doc => ({
      id: doc.id,      // nombre de la sala (usado como ID)
      ...doc.data()    // resto de la info de la sala
    }));

    return salas;
  } catch (error) {
    console.error("Error obteniendo salas:", error);
    return []; // o podés manejar un error específico
  }
}

export default function ListaSalaModal(
	{
		salas,
		setCrearSalaModal,
		user,
		setSalas,
		setListaSalaModalState
	}
) {
	const navigate = useNavigate()
	const [moneyInGameModal, setMoneyInGameModal] = useState(false)
	const [formToSala, setFormToSala] = useState({
		moneyInGame: 0,
		salaid: '',
		buyInMin: 0,
		buyInMax: 0
	})

	useEffect(() => {
		const cargarSalas = async () => {
			const salasObtenidas = await obtenerSalasDisponibles()
			setSalas(salasObtenidas)
		}
		cargarSalas()
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])	

	if(salas.length == 0){
		return(
			<div className='sala-modal--container'>
			<div className='sala-modal--box'>
				<div className='sala-modal--exit-btn' onClick={() => {setListaSalaModalState(false)}}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
					<path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z" fill='currentColor'/>
					</svg>
				</div>
				<div className="no-salas--container">
					<p>No hay salas disponibles, crea una!</p>
					<button onClick={() => {
						setCrearSalaModal(true)
						setListaSalaModalState(false)	
					}}>Crear Sala</button>
				</div>
			</div>
		</div>

		)
	}

	return(
		<div className='sala-modal--container'>
			<div className='sala-modal--box'>
				<div className='sala-modal--exit-btn' onClick={() => {setListaSalaModalState(false)}}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
					<path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z" fill='currentColor'/>
					</svg>
				</div>
				{
				salas[0]?.cargando ? 
					<div className="cargando-salas--container">
						<div className="loading-spinner--container">
							<div className="loading-spinner"></div>
							Cargando Salas...
						</div>
					</div>
					:
					<div className="table--container">
						<table>
							<thead>
								<tr>
									<th>Sala</th>
									<th>Jugadores</th>
									<th>Ciegas</th>
									<th>Entrada</th>
									<th>Acción</th>
								</tr>
							</thead>
							<tbody>
							{
								salas.map((sala) => (
									<tr key={sala.id}>
										<td>{sala.id}</td>
										<td>{sala.playersQuantity}/{sala.maxPlayers}</td>
										<td>{sala.smallBlind}/{sala.smallBlind*2}</td>
										<td>{sala.buyInMin}/{sala.buyInMax}</td>
										<td>
											{
												sala.usersList.includes(user.username) ?
												<button onClick={() => {
													navigate(`/sala?id=${sala.id}`)
												}}>Volver a la sala</button>
												:
												<button 
													disabled={sala.playersQuantity == sala.maxPlayers} 
													title={sala.playersQuantity == sala.maxPlayers ? 'Sala llena':''}
													onClick={() => {
														setMoneyInGameModal(true)
														setFormToSala({
															...formToSala,
															salaid: sala.id,
															buyInMax: sala.buyInMax,
															buyInMin: sala.buyInMin
														})
													}}>Unirse</button>
											}
										</td>
									</tr>
								))
							}
						</tbody>
						</table>
					</div>
				}
			</div>
			{
				moneyInGameModal &&
				<JoinToRoomModal
					setMoneyInGameModal={setMoneyInGameModal}
					formToSala={formToSala}
					setFormToSala={setFormToSala}
					user={user}
				/>
			}
		</div>

	)

}