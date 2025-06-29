import { auth } from "../firebaseConfig";
import { ENGINE_URL } from "../lambdaURL";

export async function startGame({roomID}) {
  try {
    const tuToken = await auth.currentUser.getIdToken();
    if (!roomID) {
      throw new Error("Faltan datos necesarios para unirse a la sala");
    }

    const peticion = await fetch(ENGINE_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        roomID,
        token: tuToken,
        method: "startGame"
      })
    });

    if (!peticion.ok) {
      const errorData = await peticion.json();
      throw new Error(errorData.message || "Error al unirse a la sala");
    }

    const respuesta = await peticion.json();
    return {
      status: 200,
      message: respuesta.message
    }

  } catch (error) {
    return { 
      status: 500,
      message: error.message 
    };
  }  
}
