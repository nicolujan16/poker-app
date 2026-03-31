import admin from "firebase-admin";
const FieldValue = admin.firestore.FieldValue;

admin.initializeApp({
	credential: admin.credential.cert({
		projectId: process.env.PROJECT_ID,
		clientEmail: process.env.CLIENT_EMAIL,
		privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
	}),
	databaseURL: process.env.DATABASE_URL,
});

const RTDB = admin.database();
const FirestoreDatabase = admin.firestore();

// VERIFICAR USUARIO
async function verifyUser(idToken) {
	// Logica para verificar usuario
	if (!idToken) {
		throw new Error("Token no provisto");
	}
	try {
		const user = await admin.auth().verifyIdToken(idToken);
		return user;
	} catch (error) {
		throw new Error("Token invalido");
	}
}

// CREAR SALA NUEVA
async function createRoom({ salaRTDB, salaFDB }) {
	try {
		let userFichasInGame = salaRTDB.users[0].fichasInGame;
		let userUID = salaRTDB.users[0].userUID;
		let userFDB = await FirestoreDatabase.collection("Users")
			.doc(userUID)
			.get();
		let userFichas = userFDB.data().fichas;

		if (userFichasInGame > userFichas) {
			throw new Error("No tienes suficientes fichas");
		}

		if (userFDB.data().fichasInGame > 0) {
			throw new Error("Ya tienes una sala activa");
		}

		await FirestoreDatabase.collection("Users")
			.doc(userUID)
			.update({
				fichas: Number(userFichas) - Number(userFichasInGame),
				fichasInGame: FieldValue.increment(Number(userFichasInGame)),
			});

		// Separar datos públicos y privados según tu estructura
		const publicData = {
			nombreSala: salaRTDB.nombreSala,
			bigBlind: salaRTDB.bigBlind,
			smallBlind: salaRTDB.smallBlind,
			buyInMin: salaRTDB.buyInMin,
			buyInMax: salaRTDB.buyInMax,
			isPrivate: salaRTDB.isPrivate,
			maxPlayers: salaRTDB.maxPlayers,
			roomState: salaRTDB.roomState,
			users: salaRTDB.users,
			admin: salaRTDB.users[0].username,
			creationDate: salaRTDB.creationDate,
		};

		const privateData = {
			adminUID: salaRTDB.adminUID,
			password: salaRTDB.password,
			creationDate: salaRTDB.creationDate,
			usersPrivate: salaRTDB.users.map((user) => ({
				userUID: user.userUID,
				isAdmin: user.isAdmin,
			})),
		};

		// CREAR EN RTDB y FDB
		await RTDB.ref(`salas/${salaRTDB.nombreSala}`).set({
			publicData,
			privateData,
		});
		await FirestoreDatabase.collection("Salas").doc(salaFDB.name).set(salaFDB);

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Sala creada",
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: `${error.message}`,
			}),
		};
	}
}

// ELIMINAR SALA
async function deleteRoom({ roomToDelete, userUID }) {
	try {
		const salaRefRTDB = await RTDB.ref(`salas/${roomToDelete}`);
		const salaSnapshot = await salaRefRTDB.once("value");

		if (!salaSnapshot.exists()) {
			throw new Error("Sala no encontrada en DB");
		}

		const salaData = salaSnapshot.val();
		const users = salaData.publicData?.users || [];

		// Reembolsar fichas a todos los jugadores de la sala
		for (const user of users) {
			const userRef = FirestoreDatabase.collection("Users").doc(user.userUID);
			const userDoc = await userRef.get();

			if (!userDoc.exists) continue;

			const userData = userDoc.data();
			const fichasActuales = userData.fichas || 0;
			const fichasEnJuego = user.fichasInGame || 0;

			await userRef.update({
				fichas: fichasActuales + fichasEnJuego,
				fichasInGame: 0,
			});
		}

		// Eliminar la sala de RTDB y Firestore
		await salaRefRTDB.remove();
		await FirestoreDatabase.collection("Salas").doc(roomToDelete).delete();

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Sala eliminada y fichas devueltas correctamente",
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Error al eliminar sala",
				error: error.message,
				stack: error.stack,
			}),
		};
	}
}

// ENTRAR A SALA
async function joinRoom({ sala, userUID, moneyInGame, password }) {
	try {
		const salaRef = await RTDB.ref(`salas/${sala}`);
		const salaSnapshot = await salaRef.once("value");

		if (!salaSnapshot.exists()) {
			return {
				statusCode: 404,
				body: JSON.stringify({ message: "Sala no encontrada" }),
			};
		}

		const salaData = salaSnapshot.val();

		// Verificamos password
		if (salaData.publicData.isPrivate) {
			if (!password) {
				return {
					statusCode: 400,
					body: JSON.stringify({ message: "Contraseña requerida" }),
				};
			}
			if (password !== salaData.privateData.password) {
				return {
					statusCode: 400,
					body: JSON.stringify({ message: "Contraseña incorrecta" }),
				};
			}
		}

		const publicUsers = salaData.publicData?.users || [];
		const privateUsers = salaData.privateData?.usersPrivate || [];
		const maxPlayers = salaData.publicData?.maxPlayers || 0;

		// Verificamos si ya está llena la sala
		if (publicUsers.length >= maxPlayers) {
			throw new Error("Sala llena");
		}

		// Verificamos si el usuario ya está en la sala
		const yaEsta = privateUsers.some((u) => u.userUID === userUID);
		if (yaEsta) {
			return {
				statusCode: 200,
				body: JSON.stringify({ message: "El usuario ya está en la sala" }),
			};
		}

		// Verificamos si las fichas son validas
		if (
			moneyInGame < salaData.publicData.buyInMin ||
			moneyInGame > salaData.publicData.buyInMax
		) {
			throw new Error("Cantidad de fichas inválidas");
		}

		// ---- FDB ----
		const userRef = FirestoreDatabase.collection("Users").doc(userUID);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return {
				statusCode: 404,
				body: JSON.stringify({ message: "Usuario no encontrado" }),
			};
		}

		const userData = userDoc.data();

		if (userData.fichasInGame > 0) {
			throw new Error("El usuario ya está en una sala");
		}

		if (userData.fichas < moneyInGame) {
			throw new Error("No tiene suficientes fichas");
		}

		// Actualizamos fichas
		await userRef.update({
			fichas: userData.fichas - moneyInGame,
			fichasInGame: (userData.fichasInGame || 0) + moneyInGame,
		});

		// Agregar a publicData.users
		publicUsers.push({
			username: userData.username,
			userUID,
			fichasInGame: moneyInGame,
			isAdmin: false,
		});

		// Agregar a privateData.usersPrivate
		privateUsers.push({
			userUID,
			isAdmin: false,
		});

		// Guardamos en RTDB
		await salaRef.child("publicData/users").set(publicUsers);
		await salaRef.child("privateData/usersPrivate").set(privateUsers);

		// ---- FDB: actualizar cantidad de jugadores y usersList ----
		const salaDocRef = FirestoreDatabase.collection("Salas").doc(sala);
		const salaDoc = await salaDocRef.get();
		const currentPlayers = salaDoc.exists
			? salaDoc.data().playersQuantity || 0
			: 0;

		// Si la sala esta en juego, entrar foldeado.
		if (salaData.publicData.roomState !== "waiting") {
			let users = salaData.gameData.infoUsers;
			users.push({
				username: userData.username,
				userUID,
				fichasInGame: moneyInGame,
				isAdmin: false,
				isTurn: false,
				hasActed: true,
				hasFolded: true,
				isAbsent: true,
			});

			await salaRef.child("gameData").update({
				infoUsers: users,
			});

			return {
				statusCode: 200,
				body: JSON.stringify({
					message: "Usuario agregado correctamente a la sala",
				}),
			};
		}

		await salaDocRef.update({
			playersQuantity: currentPlayers + 1,
			usersList: FieldValue.arrayUnion(userData.username),
		});

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Usuario agregado correctamente a la sala",
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Error al unir usuario a sala",
				error: error.message,
				stack: error.stack,
			}),
		};
	}
}

// DEJAR SALA
async function leaveRoom({ roomID, userUID }) {
	try {
		// Obtener referencia a la sala en RTDB
		const salaRef = RTDB.ref(`salas/${roomID}`);
		const salaSnapshot = await salaRef.once("value");

		if (!salaSnapshot.exists()) {
			throw new Error("Sala no encontrada");
		}

		const salaData = salaSnapshot.val();
		const publicUsers = salaData.publicData?.users || [];
		const privateUsers = salaData.privateData?.usersPrivate || [];

		// Buscar usuario en publicData
		const userIndexPublic = publicUsers.findIndex((u) => u.userUID === userUID);
		if (userIndexPublic === -1) {
			throw new Error("Usuario no encontrado en la sala");
		}

		// Buscar usuario en privateData
		const userIndexPrivate = privateUsers.findIndex(
			(u) => u.userUID === userUID,
		);
		if (userIndexPrivate === -1) {
			throw new Error("Usuario no encontrado en datos privados");
		}

		const userPublic = publicUsers[userIndexPublic];
		const fichasEnJuego = userPublic.fichasInGame;

		// Eliminar de ambas listas
		publicUsers.splice(userIndexPublic, 1);
		privateUsers.splice(userIndexPrivate, 1);

		// Actualizar RTDB
		await salaRef.child("publicData/users").set(publicUsers);
		await salaRef.child("privateData/usersPrivate").set(privateUsers);

		// ---- Firestore: actualizar fichas del usuario ----
		const userRef = FirestoreDatabase.collection("Users").doc(userUID);
		const userDoc = await userRef.get();
		const userData = userDoc.data();

		const fichasDisponibles = userData.fichas;
		const fichasTotales = fichasDisponibles + fichasEnJuego;

		await userRef.update({
			fichas: fichasTotales,
			fichasInGame: 0,
		});

		// ---- Firestore: actualizar sala ----
		await FirestoreDatabase.collection("Salas")
			.doc(roomID)
			.update({
				playersQuantity: FieldValue.increment(-1),
				usersList: FieldValue.arrayRemove(userData.username),
			});

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Usuario eliminado correctamente de la sala",
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: error.message,
			}),
		};
	}
}

// ELIMINAR USUARIO INVITADO (Limpieza completa)
async function deleteGuestUser({ userUID }) {
	try {
		console.log(`Iniciando protocolo de eliminación para invitado: ${userUID}`);

		// 1. Escanear RTDB para ver si el usuario está en alguna sala
		// Nota: Esto lee todas las salas. Si escala mucho, idealmente el usuario debería tener un campo currentRoomID en Firestore.
		const roomsRef = RTDB.ref("salas");
		const snapshot = await roomsRef.once("value");

		if (snapshot.exists()) {
			const rooms = snapshot.val();

			// Usamos un array de promesas para manejar múltiples salas en paralelo si fuera necesario
			const cleanupPromises = Object.keys(rooms).map(async (roomId) => {
				const roomData = rooms[roomId];
				const publicData = roomData.publicData || {};
				const privateData = roomData.privateData || {};

				// Verificamos si es ADMIN (Creador)
				// Chequeamos tanto por UID en privateData como por username en publicData por seguridad
				const isAdmin = privateData.adminUID === userUID;

				// Verificamos si es JUGADOR (está en la lista de usuarios)
				const isPlayer = publicData.users?.some((u) => u.userUID === userUID);

				if (isAdmin) {
					console.log(
						`El invitado es admin de la sala ${roomId}. Eliminando sala...`,
					);
					// Reutilizamos deleteRoom existente
					await deleteRoom({ roomToDelete: roomId, userUID });
				} else if (isPlayer) {
					console.log(
						`El invitado es jugador en la sala ${roomId}. Saliendo...`,
					);
					// Reutilizamos leaveRoom existente
					await leaveRoom({ roomID: roomId, userUID });
				}
			});

			// Esperamos a que termine toda la limpieza de salas
			await Promise.all(cleanupPromises);
		}

		// 2. Borrar documento de Firestore (Perfil del usuario)
		await FirestoreDatabase.collection("Users").doc(userUID).delete();

		// 3. Borrar usuario de Firebase Authentication
		await admin.auth().deleteUser(userUID);

		return {
			statusCode: 200,
			body: JSON.stringify({
				message:
					"Cuenta de invitado eliminada y limpieza completada exitosamente.",
			}),
		};
	} catch (error) {
		console.error("Error crítico eliminando invitado:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Error eliminando cuenta de invitado",
				error: error.message,
			}),
		};
	}
}

export const handler = async (event) => {
	// Verificar usuario
	const body = JSON.parse(event.body || "{}");
	const idToken = body.token;
	const user = await verifyUser(idToken);
	if (!user) {
		return {
			statusCode: 401,
			body: JSON.stringify({
				message: "Token invalido",
			}),
		};
	}
	// Verificación de token lista.

	// Lista de metodos soportados.
	switch (body.method) {
		case "createRoom":
			const salaRTDB = body.salaRTDB;
			const salaFDB = body.salaFDB;
			const salaFunction = await createRoom({ salaRTDB, salaFDB });
			return salaFunction;
			break;
		case "deleteRoom":
			const roomToDelete = body.roomName;
			const salaEliminada = await deleteRoom({
				roomToDelete,
				userUID: user.uid,
			});
			return salaEliminada;
			break;
		case "joinRoom":
			const idSala = body.roomName;
			const userUIDJoin = body.userUID;
			const moneyInGameJoin = Number(body.moneyInGame);
			const salaUnida = await joinRoom({
				sala: idSala,
				userUID: userUIDJoin,
				moneyInGame: moneyInGameJoin,
				password: body.password,
			});
			return salaUnida;
			break;
		case "leaveRoom":
			const roomIDleave = body.roomID;
			const userUIDleave = user.uid;
			const resLeaveRoom = await leaveRoom({
				roomID: roomIDleave,
				userUID: userUIDleave,
			});
			return resLeaveRoom;
			break;
		case "deleteGuestUser":
			const guestUID = user.uid;
			const result = await deleteGuestUser({ userUID: guestUID });
			return result;
			break;
		default:
			return {
				statusCode: 400,
				body: JSON.stringify({
					message: "Metodo no soportado",
				}),
			};
	}
};
