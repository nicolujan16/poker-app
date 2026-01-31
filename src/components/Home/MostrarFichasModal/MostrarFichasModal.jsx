import { useEffect, useState } from 'react'
import { doc, increment, updateDoc } from 'firebase/firestore'
import {db} from '../../../firebaseConfig.js'
import './MostrarFichasModal.css'
import Swal from 'sweetalert2'
import CuentaAtrasFichas from './CuentaAtrasFichas'

export default function MostrarFichasModal({user, setUser}){
	const [fichasClaimed, setFichasClaimed] = useState(false)

	const CUATRO_HORAS = 4 * 60 * 60 * 1000;
	useEffect(() =>{
		if(user.lastClaim == undefined){
			setFichasClaimed(false)
			return
		}
		
		const lastClaimMs =
			user.lastClaim.seconds * 1000 + Math.floor(user.lastClaim.nanoseconds / 1e6);

		const ahora = Date.now();
		const diferencia = ahora - lastClaimMs;

		if (diferencia >= CUATRO_HORAS) {
			setFichasClaimed(false);
			return
 	 	}	else{
			setFichasClaimed(true)
		}
		
		
	},[user, CUATRO_HORAS, fichasClaimed])

	const handleReclamarFichas = async () =>{

		Swal.fire({
			title: 'Recargando fichas...',
			background: "#222",
			color: "#eee",
			didOpen: () =>{
				Swal.showLoading()
			}
		})
		const ahora = new Date()
		try{
			await updateDoc(doc(db, "Users", user.uid),{
				fichas: increment(5000),
				lastClaim: ahora
			})
			setUser(prev => ({
				...prev,
				fichas: prev.fichas+5000,
				lastClaim: {
					seconds: Math.floor(ahora.getTime() / 1000),
					nanoseconds: (ahora.getTime() % 1000) * 1e6,
				},
			}))
			setFichasClaimed(true)
			Swal.close()
		}catch{
			Swal.fire({
				title: 'Ocurrió un error inesperado',
				icon: 'error'
			})
		}

	}

	return(
		<div className='mostrar-fichas--modal'>
			<div>
				<p style={{fontWeight: 'bold', letterSpacing: '2px'}}>{user.username.toUpperCase()}</p>
				<div className='mostrar-fichas-modal--fichas'>
					<svg className='svg' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
						<circle cx="32" cy="32" r="30" fill="#388E3C" stroke="#1B5E20" strokeWidth="4"/>
						<circle cx="32" cy="32" r="20" fill="#FFFFFF"/>
						<circle cx="32" cy="32" r="10" fill="#388E3C"/>
						<path d="M32 2v8M32 54v8M2 32h8M54 32h8M11.3 11.3l5.7 5.7M47 47l5.7 5.7M11.3 52.7l5.7-5.7M47 17l5.7-5.7" stroke="#FFFFFF" strokeWidth="4"/>
					</svg>
					{user.fichas}

				</div>
			</div>
			<div>
			<button disabled={fichasClaimed} onClick={handleReclamarFichas}>Reclamar fichas gratis</button>
			{
				fichasClaimed &&
				<div className='claimed--text'>
					<CuentaAtrasFichas 
						ultimaRecompensa={user.lastClaim}
						onFinish={() => setFichasClaimed(false)}	
					/>
				</div>
			}
			</div>
		
		</div>
	)
}