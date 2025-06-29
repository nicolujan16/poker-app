import { useState } from "react"
import './CrearSalaModal.css'
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import { createRoom } from "../../../logic/logic.js"

export default function CrearSalaModal({user}) {

	const navigate = useNavigate()

	const [form, setForm] = useState({
		nombreSala: `${user.username}room`,
		maxPlayers: 2,
		buyInMin: 1000,
		buyInMax: 2000,
		smallBlind: 20,
		bigBlind: 40,
		isPrivate: false,
		password: '',
		users: [
			{
				username: user.username,
				userUID: user.uid,
				isAdmin: true,
				moneyInGame: 1000
			}
		],
		roomState: "waiting"
	})

	const handleCrearSala = async (e) =>{
		e.preventDefault()
		// Verificaciones iniciales
		if (!/^[a-zA-Z0-9_-]+$/.test(form.nombreSala)) {
			Swal.fire({
				title: 'Error',
				text: 'El nombre de la sala solo puede contener letras, números, guiones y guiones bajos',
				icon: 'warning',
				background: '#222',
				color: '#fff'
			})
			return;
		}
		if(form.buyInMin < form.bigBlind * 4){
			Swal.fire({
				title: 'Error',
				text: 'El minimo de fichas para entrar a la sala tiene que ser al menos 4 ciegas grandes',
				icon: 'error',
				background: '#222',
				color: '#fff'
			})
			return
		}

		// Creamos en la base de datos la sala
		// Verificamos que no exista otra sala con ese nombre
		Swal.fire({
			title: 'Creando sala...',
			text: 'Por favor espera',
			allowOutsideClick: false, 
			background: "#222",
			color: "#eee",
			didOpen: () => {
				Swal.showLoading();
			}
		});
		const crearSalaFuncion = await createRoom({formToCreate: form, user})
		if(crearSalaFuncion.status == 200){
			Swal.close({})
			navigate(`/sala?id=${form.nombreSala}`)
		}
		if(crearSalaFuncion.status == 500){
			Swal.close({})
			Swal.fire({
				icon: "error",
				text: crearSalaFuncion.message,
				title: "Error creando sala",
				background: "#222",
				color: "#fff"
			})
		}
		
	}

	const handleInputChange = (e) =>{
		e.preventDefault()
		if(e.target.id == 'smallBlind'){
			setForm({
				...form,
				bigBlind: +e.target.value*2,
				[e.target.id] : +e.target.value
			})
			return
		}
	
		if(e.target.id == 'buyInMin'){
			if(e.target.value > form.users[0].moneyInGame){
				let newUsers = form.users[0]
				newUsers.moneyInGame = +e.target.value
				setForm({
					...form,
					[e.target.id]: +e.target.value,
					'buyInMax': +(e.target.value * 2),
					users: [
						newUsers
					]
				})
				return
			}
			setForm({
				...form,
				[e.target.id]: +e.target.value,
				'buyInMax': +(e.target.value * 2)
			})
			return
		}
		
		if(e.target.id == 'moneyInGame'){
			setForm({
				...form,
				users: [
					{
						...form.users[0],
						moneyInGame: +e.target.value
					}
				]
			})
			return
		}
		
		if(e.target.id == 'nombreSala'){
			setForm({
				...form,
				[e.target.id]: (e.target.value).toLowerCase()
			})
			return
		}
		
		setForm({
			...form,
			[e.target.id]: e.target.value
		})
	}

	return(
		<form onSubmit={handleCrearSala}>
			<div>
				<label htmlFor="nombreSala">Alias de sala</label>
				
				<input required type="text" id='nombreSala' value={form.nombreSala} onChange={handleInputChange} placeholder={`${user.username}room`}/>
			</div>
			<div>
				<label htmlFor="maxPlayers">Limite de jugadores</label>
				<input required type="number" min={2} max={6} id='maxPlayers' value={form.maxPlayers} onChange={handleInputChange}/>
			</div>
			<div className="form--fichas-iniciales">
				<label htmlFor="buyIn">Fichas Iniciales</label>
				<div>
					<label htmlFor="buyInMin">Minimo</label>
					<input required type="number" id='buyInMin' min={100} max={999999} value={form.buyInMin}onChange={handleInputChange} />
					<label htmlFor="buyInMax">Maximo</label>
					<input required type="number" disabled={true} id='buyInMax' value={form.buyInMax}onChange={handleInputChange} />
				</div>
			</div>
			<div>
				<label htmlFor="smallBlind">Ciegas:</label>
				<input required type="number" id="smallBlind" value={form.smallBlind} onChange={handleInputChange} min={10} max={200000}/>
				<input required type="number" id="bigBlind" disabled={true} value={form.bigBlind} onChange={handleInputChange} />
			</div>
			<div>
				<label htmlFor="private-room">Sala Privada</label>
				<input type="checkbox" name="private-room" id="private-room" checked={form.isPrivate} onChange={() =>{setForm({...form, isPrivate: !form.isPrivate})}}/>
				{
					form.isPrivate &&
						<input required type='password' placeholder='Password' id="password" value={form.password} onChange={handleInputChange}/>
				}
			</div>
			<div>
				<label htmlFor="moneyInGame">Fichas iniciales para ti</label>
				<input type="number" id="moneyInGame" min={form.buyInMin} max={form.buyInMax}
				value={form.users[0].moneyInGame} required onChange={handleInputChange}/>
			</div>
			<button>Crear Sala</button>
		
		</form>
	)

}