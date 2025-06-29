import { useState } from 'react'
import './RegisterModal.css'
import { registerUser } from '../../validation/validations'
import Swal from 'sweetalert2'
import zxcvbn from 'zxcvbn';
import { traducirFeedback } from '../../utils/traducirFeedback';

export default function Login({registerModalView, setRegisterModalView}) {

  const [form, setForm] = useState({
    email: '',
    password: '',
    samePassword:'',
    username: ''
  })

  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    if(e.target.id == 'username' && error == 'Nombre de usuario en uso'){
      setError('')
    }
    setForm({
      ...form,
      [e.target.id]: e.target.value
    })
  }

  const passwordIsStrong = (password) => {
    const resultado = zxcvbn(password);
    const { score, feedback } = resultado;

    if (score < 3) {
      return {
        valido: false,
        mensaje: feedback.warning || "La contraseña es débil",
        sugerencias: feedback.suggestions,
      };
    }

    return { valido: true };
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Verificar que las contraseñas coincidan
    if(form.password != form.samePassword){
      setError('Contraseñas no coinciden')
      return
    }else{
      setError('')
    }
    // Verificar que la contraseña sea fuerte
    const resultado = passwordIsStrong(form.password)
    if(!resultado.valido){
      let traduccion = traducirFeedback(resultado.mensaje)
      setError(traduccion)
      return
    }else{
      Swal.fire({
        title: 'Registrando...',
        text: 'Por favor espera',
        allowOutsideClick: false, 
        background: "#222",
        color: "#eee",
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }
    setForm({
      ...form,
      username: form.username.toLowerCase()
    })
    const register = await registerUser(form)
    handleResponse(register)
  }

  const handleResponse = async (res) => {
    Swal.close()
    if(res.message == 'Firebase: Error (auth/email-already-in-use).'){
      res.message = 'El correo ya esta en uso'
    }
    if(res.status == "409"){
      res.message = 'Nombre de usuario en uso'
    }
    Swal.fire({
      title: res.message,
      icon: "error",
      background: "#222",
      color: "#eee"
    })
    if(res.status != 200){
      setError(res.message)
      return
    }

    // Si esta todo ok, recargamos la pagina
   
    Swal.fire({
      title: "Registrado!",
      text: "Usuario registrado exitosamente",
      icon: "success",
      background: "#222",
      color: "#fff"
    })
  }

  return (
    <>
      <div className='register-container'>
        <div className='register-box'>
          <div className='register--exit-btn' onClick={() =>setRegisterModalView(!registerModalView)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
              <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
            </svg>
          </div>
          <h3>Registrate!</h3>
          <form action="#" className='register-form' onSubmit={handleSubmit}>
            <input type="email" placeholder='Correo Electronico' required id='email' onChange={handleInputChange} />
            <input type="text" placeholder='Nombre de usuario' required id='username' onChange={handleInputChange} />
            <input type="password" placeholder='Contraseña' required onChange={handleInputChange} id='password'/>
            <input type="password" placeholder='Repetir contraseña' required onChange={handleInputChange} id='samePassword' />
            {
              error.length > 0 && <p>{error}</p>
            }
            <button>Crear cuenta</button>
          </form>
        </div>
      </div>
    </>
  )
}