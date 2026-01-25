import './SettingsModal.css'


export default function SettingsModal({handleLogOut}){

  return(
		<div className='settings-modal'>
			<button>Cambiar Username</button>
			<button>Cambiar Contraseña</button>
			<button onClick={handleLogOut}>Cerrar Sesión</button>
		</div>
	)
}