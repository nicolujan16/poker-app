import { ref, update } from "firebase/database";
import { auth, RTDB } from "../firebaseConfig";
import { ENGINE_URL } from "../lambdaURL";

export async function startGame({roomID}) {
  try {
    const roomStateRef = ref(RTDB, `salas/${roomID}/publicData`);
    await update(roomStateRef, {
      roomState: "starting"
    });
    } catch (error) {
    console.error("❌ Error al actualizar roomState:", error);
  }



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

export async function userAction({roomID, action, amount = 0}) {
  try {
    const tuToken = await auth.currentUser.getIdToken();
    if (!roomID || !action) {
      throw new Error("Faltan datos para realizar la peticion");
    }
    if(action !== 'Fold' && action !=='Check' && amount == 0 ){
      throw new Error(`Monto invalido para ${action}`)
    }

    const peticion = await fetch(ENGINE_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        roomID,
        token: tuToken,
        method: "handleUserAction",
        action,
        amount
      })
    });

    if (!peticion.ok) {
      const errorData = await peticion.json();
      throw new Error(errorData.message || "Error al foldear");
    }

    const respuesta = await peticion.json();
    return {
      status: 200,
      message: respuesta.message,
      action: respuesta.action,
      amount: respuesta.amount
    }

  } catch (error) {
    return { 
      status: 500,
      message: error.message 
    };
  }  
  
}
