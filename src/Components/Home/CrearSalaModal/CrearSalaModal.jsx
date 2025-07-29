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
				fichasInGame: 1000
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

		if(
			form.users[0].fichasInGame > form.buyInMax ||
			form.users[0].fichasInGame < form.buyInMin
		 ){
			Swal.fire({
				icon: "warning",
				text: "Respete los valores minimos y maximos de entrada",
				background: "#222",
				color: "#fff"
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
			if(e.target.value > form.users[0].fichasInGame){
				let newUsers = form.users[0]
				newUsers.fichasInGame = +e.target.value
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
		
		if(e.target.id == 'fichasInGame'){
			setForm({
				...form,
				users: [
					{
						...form.users[0],
						fichasInGame: +e.target.value
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
		
		if(e.target.id == 'buyInMax'){
			setForm({
				...form,
				[e.target.id]: +e.target.value
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
			<div className="form--div">
				<label htmlFor="nombreSala">Alias de sala</label>
				<input required type="text" id='nombreSala' value={form.nombreSala} onChange={handleInputChange} placeholder={`${user.username}room`}/>
			</div>
			<div className="form--div">
				<label htmlFor="maxPlayers">Limite de jugadores</label>
				<div>
					<input required type="range" className="simple-slider" min={2} max={6} step={1} id='maxPlayers' value={form.maxPlayers} onChange={handleInputChange}/>
					<p>{form.maxPlayers}</p>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="#fff"><path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z"/></svg>
				</div>
			</div>
			<div>
				<label htmlFor="smallBlind">Ciegas:</label>
				<input required type="number" id="smallBlind" value={form.smallBlind} onChange={handleInputChange} min={10} max={200000}/>
				<input required type="number" id="bigBlind" disabled={true} value={form.bigBlind} onChange={handleInputChange} />
			</div>
			<div className="form--fichas-iniciales">
				<label htmlFor="buyIn">Fichas Iniciales</label>
				<div>
					<label htmlFor="buyInMin">Min - Max</label>
					<input required type="number" id='buyInMin' min={100} max={999999} value={form.buyInMin}onChange={handleInputChange} />
					<input required type="number" id='buyInMax' value={form.buyInMax}onChange={handleInputChange} />
				</div>
			</div>
			
			<div>
				<label htmlFor="private-room">Sala Privada</label>
				<input type="checkbox" name="private-room" id="private-room" checked={form.isPrivate} onChange={() =>{setForm({...form, isPrivate: !form.isPrivate})}}/>
				{
					form.isPrivate &&
						<input required type='password' placeholder='Password' id="password" value={form.password} onChange={handleInputChange}/>

				}
			</div>
			<div className="form--div">
				<label htmlFor="fichasInGame">Fichas iniciales para ti</label>
				<div>
					<input 
						type="range" 
						className="simple-slider"
						id="fichasInGame"
						min={form.buyInMin}
						max={form.buyInMax}
						value={form.users[0].fichasInGame}
						required
						onChange={handleInputChange}
						step={form.smallBlind}
						/>
						<div className="fichas-iniciales--fichas">
							<svg className='svg' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
								<circle cx="32" cy="32" r="30" fill="#388E3C" stroke="#1B5E20" strokeWidth="4"/>
								<circle cx="32" cy="32" r="20" fill="#FFFFFF"/>
								<circle cx="32" cy="32" r="10" fill="#388E3C"/>
								<path d="M32 2v8M32 54v8M2 32h8M54 32h8M11.3 11.3l5.7 5.7M47 47l5.7 5.7M11.3 52.7l5.7-5.7M47 17l5.7-5.7" stroke="#FFFFFF" strokeWidth="4"/>
							</svg>
							<p>{form.users[0].fichasInGame}</p>
							<p>- {form.users[0].fichasInGame / form.bigBlind} BBs</p>
						</div>
				</div>
			</div>
			<button>Crear Sala</button>
		
		</form>
	)

}