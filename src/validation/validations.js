import {createUserWithEmailAndPassword } from "firebase/auth";
import {collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import {db, auth} from '../firebaseConfig'; // tu config de firebase


export const registerUser = async (form) => {
  const { email, password } = form
  const username = form.username.toLowerCase();

  try {
    // Paso 1: Verificar si el username ya existe
    const q = query(collection(db, "Users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return {
        status: 409,
        message: 'Nombre de usuario en uso'
      };
    }

    // Paso 2: Registrar el usuario con Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Paso 3: Guardar info del usuario en Firestore
    await setDoc(doc(db, "Users", user.uid), {
      uid: user.uid,
      email,
      username,
      fichas: 15000,
      createdAt: new Date()
    });

    return {
      status: 200,
      message: 'Usuario registrado correctamente'
    }

  } catch (error) {
    return error
  }
}

export const getUsername = async (user) => {
   try {
      const userDocRef = doc(db, "Users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        
        return userDocSnap.data()
      } else {
        return {
          status: 400,
          response: 'Nombre de usuario no encontrado.'
        }
      }
    } catch (error) {
      console.error("Error obteniendo el username:", error);
    }
}