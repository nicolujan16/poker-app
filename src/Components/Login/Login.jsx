import { useEffect, useState } from 'react'
import './Login.css'
import RegisterModal from '../RegisterModal/RegisterModal'
import {onAuthStateChanged, signInWithEmailAndPassword,  browserLocalPersistence, browserSessionPersistence, setPersistence } from 'firebase/auth'
import {auth}  from '../../firebaseConfig'
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2'
import { firebaseErrorMessages } from '../../utils/traducirFeedback'


export default function Login() {
  const [registerModalView, setRegisterModalView] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: ''
  })
  const [mantenerLogin, setMantenerLogin] = useState(false)

  const navigate = useNavigate();
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          Swal.close()
          navigate('/home')
        }
      });

      return () => unsubscribe(); // limpieza del listener
    }, [navigate]);

  // controlamos el modal de Register
  const handleRegisterModal = (e) => {
    e.preventDefault()
    setRegisterModalView(true)
  }

  // controlamos los inputs
  const handleInputChange = (e) => {
    e.preventDefault()
    setForm({
      ...form,
      [e.target.id]: e.target.value
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Iniciando Sesión...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      background: "#222",
      color: "#eee",
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    const persistencia = mantenerLogin ? browserLocalPersistence : browserSessionPersistence;
  
    try {
      await setPersistence(auth, persistencia);
      await signInWithEmailAndPassword(auth, form.email, form.password);
      Swal.close();
    } catch (err) {
      Swal.close();
      let mensajeDeError = firebaseErrorMessages(err.message)
      Swal.fire({
        title: 'Error',
        text: mensajeDeError,
        background: "#222",
        color: "#eee"
      });
    }
  };
  

  return (
    <>
      <div className='main-container'>
        <h2>¡Inicia Sesión!</h2>
        <form className='login-container' onSubmit={handleLogin}>
          <input type="text" value={form.email} placeholder='Correo electronico' id='email' onChange={handleInputChange}/>
          <input type="password" value={form.password} placeholder='Contraseña' id='password' onChange={handleInputChange} />
          <div className='login--mantener-container'>
            <input type="checkbox" checked={mantenerLogin} id='mantenerLogin' onChange={() => {setMantenerLogin(!mantenerLogin)}}/>
            <label htmlFor="mantenerLogin">Mantener sesión iniciada.</label>
          </div>
          <button>Iniciar Sesión</button>
          <p>¿Aun no tienes cuenta? <a href='#' onClick={handleRegisterModal}>Registrate aqui</a></p>
          <a href='#'>Olvide mi contraseña</a>
        </form>


        {
          registerModalView &&
          <RegisterModal 
            registerModalView={registerModalView}
            setRegisterModalView={setRegisterModalView}
          ></RegisterModal>
        }
      </div >
    </>
  )
}
