import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { API_URL } from "../lambdaURL";

export async function leaveSala({ roomID }) {
	try {
		const tuToken = await auth.currentUser.getIdToken();
		const peticion = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify({
				method: "leaveRoom",
				token: tuToken,
				roomID,
			}),
		});

		if (!peticion.ok) {
			const errorData = await peticion.json();
			throw new Error(errorData.message || "Error al dejar la sala");
		}

		const respuesta = await peticion.json();
		return {
			status: 200,
			message: respuesta,
		};
	} catch (err) {
		return {
			status: 500,
			message: err.message,
		};
	}
}

export async function joinRoom({ user, roomID, buyIn, password }) {
	try {
		const tuToken = await auth.currentUser.getIdToken();
		if (!user || !user.uid || !roomID || !buyIn) {
			throw new Error("Faltan datos necesarios para unirse a la sala");
		}

		const peticion = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				roomName: roomID,
				userUID: user.uid,
				moneyInGame: buyIn,
				password: password,
				token: tuToken,
				method: "joinRoom",
			}),
		});

		if (!peticion.ok) {
			const errorData = await peticion.json();
			throw new Error(errorData.message || "Error al unirse a la sala");
		}

		const respuesta = await peticion.json();
		return respuesta;
	} catch (error) {
		return { error: true, message: error.message };
	}
}

export async function eliminarSala({ roomName }) {
	const tuToken = await auth.currentUser.getIdToken();
	try {
		const peticion = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify({
				roomName,
				method: "deleteRoom",
				token: tuToken,
			}),
		});
		if (!peticion.ok) {
			throw new Error("Error en la peticion");
		}

		const respuesta = await peticion.json();
		return respuesta;
	} catch (err) {
		console.log(err);
		return err;
	}
}

export async function createRoom({ formToCreate, user }) {
	try {
		// 1. Verificación previa de existencia (esto está ok)
		const docSalaRef = doc(db, "Salas", formToCreate.nombreSala);
		const existeSala = await getDoc(docSalaRef);
		if (existeSala.exists()) {
			throw new Error("Nombre de sala en uso");
		}

		// 2. CORRECCIÓN AQUÍ: Estructurar 'users' como lo pide el Lambda
		const salaNueva = {
			...formToCreate,
			adminUID: user.uid,
			creationDate: new Date(),
			// AGREGAMOS EL ARRAY USERS QUE PIDE TU LAMBDA
			users: [
				{
					userUID: user.uid,
					username: user.username, // Necesario porque el Lambda lo usa en publicData.admin
					fichasInGame: formToCreate.creatorInitialChips, // Usamos el valor del slider
					isAdmin: true,
				},
			],
		};

		// 3. Datos públicos para Firestore (esto sigue igual)
		const salaDatosPublicos = {
			name: salaNueva.nombreSala,
			admin: user.username,
			state: salaNueva.roomState,
			playersQuantity: 1,
			maxPlayers: salaNueva.maxPlayers,
			buyInMin: salaNueva.buyInMin,
			buyInMax: salaNueva.buyInMax,
			smallBlind: salaNueva.smallBlind,
			usersList: [user.username],
			isPrivate: salaNueva.isPrivate,
		};

		// 4. Petición al Lambda
		const tuToken = await auth.currentUser.getIdToken();
		const peticion = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				token: tuToken,
				method: "createRoom",
				salaRTDB: salaNueva, // Ahora sí lleva .users[0]
				salaFDB: salaDatosPublicos,
			}),
		});

		if (!peticion.ok) {
			let res = await peticion.json();
			throw new Error(res.message);
		}

		const respuesta = await peticion.json();
		return {
			status: 200,
			message: respuesta,
		};
	} catch (error) {
		return {
			status: 500,
			message: `${error}`,
		};
	}
}
