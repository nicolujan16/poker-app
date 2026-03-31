import admin from "firebase-admin";
import pkg from "pokersolver";
const { Hand } = pkg;

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
		const userRef = FirestoreDatabase.collection("Users").doc(user.uid);
		const userDoc = await userRef.get();
		if (!userDoc.exists) {
			throw new Error("Usuario no encontrado");
		}
		const userData = userDoc.data();
		if (userData.isBanned) {
			throw new Error("Usuario baneado");
		}
		if (userData.isDeleted) {
			throw new Error("Usuario eliminado");
		}
		return {
			...user,
			username: userData.username,
		};
	} catch (error) {
		throw new Error("Token invalido");
	}
}

// Generar ID de cada mano
async function generateHandID() {
	return "hand_" + Date.now();
}

// Definir ganador y darle el pozo
async function finishRoundAndGivePotToWinner({ roomID }) {
	try {
		const salaRefRTDB = RTDB.ref(`salas/${roomID}`);
		const salaSnapshot = await salaRefRTDB.once("value");

		if (!salaSnapshot.exists()) {
			throw new Error("Sala no encontrada");
		}

		const salaData = salaSnapshot.val();

		// 1️⃣ Filtrar jugadores activos (los que no foldearon)
		const activePlayers = salaData.gameData.infoUsers.filter(
			(u) => !u.hasFolded,
		);

		if (activePlayers.length === 0) {
			throw new Error("No quedan jugadores activos");
		}

		// 🔄 Función para convertir las cartas a formato de pokersolver
		function convertCard(card) {
			let value = card.slice(0, -1); // 'A', '10', 'J', etc.
			const suit = card.slice(-1); // 'C', 'D', 'T', 'P'

			if (value === "10") value = "T";

			const suitMap = {
				C: "c", // clubs
				D: "d", // diamonds
				T: "h", // hearts
				P: "s", // spades
			};

			return value + suitMap[suit];
		}

		// 2️⃣ Armar manos (jugador + cartas comunitarias)
		const playerHands = activePlayers.map((player) => {
			const playerCards = salaData.usersCards[player.userUID].map(convertCard);
			const communityCards = salaData.gameData.communityCards.map(convertCard);

			return {
				userUID: player.userUID,
				username: player.username,
				hand: Hand.solve([...playerCards, ...communityCards]),
			};
		});

		// 3️⃣ Determinar ganadores
		const winners = Hand.winners(playerHands.map((p) => p.hand));

		// Puede haber más de un ganador si empatan, vamos a buscar cuál jugador es
		// Tomamos el primero como principal para guardar en la DB
		const winnerHand = winners[0];
		const winnerPlayer = playerHands.find((p) => p.hand === winnerHand);

		const pot = salaData.gameData.pot;

		console.log(
			`Ganador: ${winnerPlayer.username} con ${winnerHand.descr}. Pot: ${pot}`,
		);

		// 5️⃣ Sumar el pot al ganador
		const winnerIndex = salaData.publicData.users.findIndex(
			(u) => u.userUID === winnerPlayer.userUID,
		);
		if (winnerIndex === -1) {
			throw new Error("Ganador no encontrado en publicData");
		}

		await salaRefRTDB
			.child(`publicData/users/${winnerIndex}/fichasInGame`)
			.transaction((actual) => (actual || 0) + pot);

		// 6️⃣ Resetear datos del juego
		await salaRefRTDB.child("gameData").update({
			lastWinner: {
				username: winnerPlayer.username,
				handName: winnerHand.descr,
				amountWinned: salaData.gameData.pot,
				userCards: salaData.usersCards[winnerPlayer.userUID],
			},
			pot: 0,
			lastActionTime: new Date().getTime(),
		});

		// Resetear usersCards
		let emptyUsersCards = {};
		salaData.publicData.users.forEach((user) => {
			emptyUsersCards[user.userUID] = [];
		});

		await salaRefRTDB.update({
			usersCards: emptyUsersCards,
		});

		// roomState en waiting
		await salaRefRTDB.child("publicData").update({
			roomState: "waiting",
		});

		// Poner el isTurn de todos los jugadores en false
		let newUsers = salaData.gameData.infoUsers.map((user) => {
			return {
				...user,
				isTurn: false,
				hasFolded: false,
			};
		});

		await salaRefRTDB.child("gameData").update({
			infoUsers: newUsers,
		});

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: `Ganador: ${winnerPlayer.username} con ${winnerHand.descr}`,
				winner: {
					userUID: winnerPlayer.userUID,
					username: winnerPlayer.username,
					handName: winnerHand.descr,
				},
			}),
		};
	} catch (err) {
		console.error(err);
		return {
			statusCode: 400,
			body: JSON.stringify({
				message: err.message,
			}),
		};
	}
}

// Iniciar juego
async function startGame({ user, roomID }) {
	try {
		const salaRefRTDB = RTDB.ref(`salas/${roomID}`);
		const salaSnapshot = await salaRefRTDB.once("value");

		if (!salaSnapshot.exists()) {
			throw new Error("Sala no encontrada");
		}

		const salaData = salaSnapshot.val();

		// Hacemos un array de los UIDs de usuarios
		const usersPrivateData = salaData.privateData.usersPrivate;
		const usersUIDs = usersPrivateData.map((user) => user.userUID);
		// Ver la cantidad de jugadores que tenemos
		const playersQuantity = salaData.publicData.users.length;
		const usersCards = {};

		// Repartir cartas aleatorias a cada uno
		const cartasPoker = [
			"2C",
			"3C",
			"4C",
			"5C",
			"6C",
			"7C",
			"8C",
			"9C",
			"10C",
			"JC",
			"QC",
			"KC",
			"AC",
			"2D",
			"3D",
			"4D",
			"5D",
			"6D",
			"7D",
			"8D",
			"9D",
			"10D",
			"JD",
			"QD",
			"KD",
			"AD",
			"2T",
			"3T",
			"4T",
			"5T",
			"6T",
			"7T",
			"8T",
			"9T",
			"10T",
			"JT",
			"QT",
			"KT",
			"AT",
			"2P",
			"3P",
			"4P",
			"5P",
			"6P",
			"7P",
			"8P",
			"9P",
			"10P",
			"JP",
			"QP",
			"KP",
			"AP",
		];

		usersUIDs.forEach((userUID) => {
			usersCards[userUID] = [];
			for (let i = 0; i < 2; i++) {
				const randomIndex = Math.floor(Math.random() * cartasPoker.length);
				const carta = cartasPoker.splice(randomIndex, 1)[0];
				usersCards[userUID].push(carta);
			}
		});

		let playersQty = salaData.publicData.users.length;

		let prevDealer = salaData.gameData?.dealerIndex ?? -1;

		let dealerIndex = (prevDealer + 1) % playersQty;
		let smallBlindIndex = (dealerIndex + 1) % playersQty;
		let bigBlindIndex = (dealerIndex + 2) % playersQty;
		let infoUsers =
			salaData.gameData?.infoUsers ??
			salaData.publicData.users.map((user) => {
				return {
					...user,
					hasActed: false,
					hasFolded: false,
					isTurn: false,
					turnInit: null,
				};
			});

		let turnDuration = 40 * 1000;
		// crear gameData
		const gameData = {
			turnDuration,
			pot: salaData.publicData.bigBlind + salaData.publicData.smallBlind,
			currentBet: salaData.publicData.bigBlind,
			hasBet: true, //La ciega grande cuenta como bet>
			bigBlind: salaData.publicData.bigBlind,
			smallBlind: salaData.publicData.smallBlind,
			dealerUsername: salaData.publicData.users[dealerIndex].username, // el username del jugador que empieza como dealer
			dealerIndex: dealerIndex,
			smallBlindIndex: smallBlindIndex,
			bigBlindIndex: bigBlindIndex,
			communityCards: [], // cartas comunitarias en la mesa
			infoUsers,
			lastAction: null, // ej: { playerID, action, amount }
			totalRounds: 0, // cuántas manos se jugaron en esta sala
			lastActionTime: new Date().getTime(), // timestamp de la última acción
			handID: generateHandID(), // si querés, para identificar la mano
		};

		// Descontar lo de Big Blind y Small Blind del saldo de cada jugador
		// ---FDB---
		const usersRef = FirestoreDatabase.collection("Users");
		// ---RTDB---
		const usersWithFichasUpdated = [];
		for (let index = 0; index < salaData.publicData.users.length; index++) {
			const userObj = salaData.publicData.users[index];

			if (index === smallBlindIndex) {
				// Descontar en Firestore
				await usersRef.doc(userObj.userUID).update({
					fichasInGame: FieldValue.increment(-gameData.smallBlind),
				});

				usersWithFichasUpdated.push({
					...userObj,
					fichasInGame: userObj.fichasInGame - gameData.smallBlind,
					bet: gameData.smallBlind,
					hasActed: false,
				});
				continue;
			}

			if (index === bigBlindIndex) {
				await usersRef.doc(userObj.userUID).update({
					fichasInGame: FieldValue.increment(-gameData.bigBlind),
				});

				usersWithFichasUpdated.push({
					...userObj,
					fichasInGame: userObj.fichasInGame - gameData.bigBlind,
					bet: gameData.bigBlind,
					hasActed: false,
				});
				continue;
			}

			usersWithFichasUpdated.push({ ...userObj });
		}

		await salaRefRTDB.update({
			usersCards: usersCards,
			gameData: gameData,
		});

		await salaRefRTDB.child("publicData").update({
			roomState: "preflop",
			users: usersWithFichasUpdated,
		});

		await salaRefRTDB.child("gameData").update({
			infoUsers: usersWithFichasUpdated,
		});

		let playerButton = dealerIndex;
		let playerTurn = (playerButton + 3) % playersQuantity;

		await salaRefRTDB.child(`gameData/infoUsers/${playerTurn}`).update({
			isTurn: true,
			turnInit: new Date().getTime(),
		});

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Cartas repartidas",
			}),
		};
	} catch (error) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				message: error.message,
			}),
		};
	}
}

// Pasar a siguiente roomState
async function nextGameState({ user, roomID }) {
	try {
		const salaRefRTDB = RTDB.ref(`salas/${roomID}`);
		const salaSnapshot = await salaRefRTDB.once("value");

		if (!salaSnapshot.exists()) {
			throw new Error("Sala no encontrada");
		}

		const salaData = salaSnapshot.val();

		const cartasPoker = [
			"2C",
			"3C",
			"4C",
			"5C",
			"6C",
			"7C",
			"8C",
			"9C",
			"10C",
			"JC",
			"QC",
			"KC",
			"AC",
			"2D",
			"3D",
			"4D",
			"5D",
			"6D",
			"7D",
			"8D",
			"9D",
			"10D",
			"JD",
			"QD",
			"KD",
			"AD",
			"2T",
			"3T",
			"4T",
			"5T",
			"6T",
			"7T",
			"8T",
			"9T",
			"10T",
			"JT",
			"QT",
			"KT",
			"AT",
			"2P",
			"3P",
			"4P",
			"5P",
			"6P",
			"7P",
			"8P",
			"9P",
			"10P",
			"JP",
			"QP",
			"KP",
			"AP",
		];

		let usersCards = salaData.usersCards;
		let communityCards = salaData.gameData?.communityCards || [];

		// Sacamos del mazo todas las cartas que ya son comunitarias.
		if (communityCards) {
			communityCards.forEach((carta) => {
				const index = cartasPoker.indexOf(carta);
				if (index !== -1) {
					cartasPoker.splice(index, 1);
				}
			});
		}

		// Sacamos del mazo todas las cartas que tengan los usuarios
		Object.values(usersCards).forEach((userID) => {
			userID.forEach((carta) => {
				const index = cartasPoker.indexOf(carta);
				if (index !== -1) {
					cartasPoker.splice(index, 1);
				}
			});
		});

		await salaRefRTDB.child("gameData").update({
			hasBet: false,
			currentBet: 0,
		});

		// Logica para iniciar el FLOP
		if (salaData.publicData.roomState == "preflop") {
			communityCards = [];
			for (let i = 0; i < 3; i++) {
				const randomIndex = Math.floor(Math.random() * cartasPoker.length);
				const carta = cartasPoker.splice(randomIndex, 1)[0];
				communityCards.push(carta);
			}

			await salaRefRTDB.child("gameData").update({
				communityCards: communityCards,
			});
			await salaRefRTDB.child("publicData").update({
				roomState: "flop",
			});
		}

		// logica para ir al TURN
		if (salaData.publicData.roomState == "flop") {
			// añadimos una cartas mas al communityCards
			let turnCardIndex = Math.floor(Math.random() * cartasPoker.length);
			let turnCard = cartasPoker.splice(turnCardIndex, 1)[0];
			communityCards.push(turnCard);
			await salaRefRTDB.child("gameData").update({
				communityCards: communityCards,
			});
			await salaRefRTDB.child("publicData").update({
				roomState: "turn",
			});
		}

		// Pasamos al RIVER y mostramos la ultima carta
		if (salaData.publicData.roomState == "turn") {
			// añadimos una cartas mas al communityCards
			let riverCardIndex = Math.floor(Math.random() * cartasPoker.length);
			let riverCard = cartasPoker.splice(riverCardIndex, 1)[0];
			communityCards.push(riverCard);
			await salaRefRTDB.child("gameData").update({
				communityCards: communityCards,
			});
			await salaRefRTDB.child("publicData").update({
				roomState: "river",
			});
		}

		// Pasamos al showdown y aca verificamos quien gano
		if (salaData.publicData.roomState == "river") {
			// Verificamos quien gano
			let verifyWinnerFunction = await finishRoundAndGivePotToWinner({
				roomID,
			});
			return verifyWinnerFunction;
		}

		// Ahora definimos de quien es el turno
		let playerButton = salaData.gameData.dealerIndex;
		let playersQuantity = salaData.gameData.infoUsers.length;

		let nextUserTurnIndex = null;

		for (let i = 1; i <= playersQuantity; i++) {
			let candidateIndex = (playerButton + i) % playersQuantity;
			let user = salaData.gameData.infoUsers[candidateIndex];
			if (!user.hasFolded) {
				nextUserTurnIndex = candidateIndex;
				break;
			}
		}

		// Reseteamos isTurn y hasActed para todos si hay siguiente turno
		if (nextUserTurnIndex !== null) {
			let infoUsersUpdated = salaData.gameData.infoUsers.map((user) => {
				if (!user.hasFolded) {
					return {
						...user,
						isTurn: false,
						hasActed: false,
						bet: 0,
					};
				}
				return user;
			});

			infoUsersUpdated[nextUserTurnIndex] = {
				...infoUsersUpdated[nextUserTurnIndex],
				isTurn: true,
				turnInit: Date.now(),
				bet: 0,
			};

			await salaRefRTDB
				.child("gameData")
				.update({ infoUsers: infoUsersUpdated });
		} else {
			throw new Error("Error al asignar siguiente turno.");
		}

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: "Cartas repartidas",
			}),
		};
	} catch (err) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				message: err.message,
			}),
		};
	}
}

// Ejecutar cada accion de jugador
async function handleUserAction({ user, roomID, action, amount }) {
	try {
		const salaRefRTDB = RTDB.ref(`salas/${roomID}`);
		const salaSnapshot = await salaRefRTDB.once("value");

		if (!salaSnapshot.exists()) {
			throw new Error("Sala no encontrada");
		}

		const salaData = salaSnapshot.val();

		// Si un usuario foldea
		if (action == "Fold") {
			let everyUserExceptUs = salaData.gameData.infoUsers.filter(
				(u) => u.userUID != user.uid,
			);
			let usersNotFolded = everyUserExceptUs.filter((u) => !u.hasFolded);
			// Si solo queda un jugador despues de foldear, el ultimo jugador se lleva el pozo
			if (usersNotFolded.length == 1) {
				// TERMINAR RONDA
				// darle las fichas al jugador que queda
				let userWinnerIndex = salaData.gameData.infoUsers.findIndex(
					(u) => u.username == usersNotFolded[0].username,
				);

				await salaRefRTDB
					.child(`publicData/users/${userWinnerIndex}/fichasInGame`)
					.transaction((actual) => (actual || 0) + salaData.gameData.pot);

				// settear lastAction, y actualizar el estado de la sala
				await salaRefRTDB.child("gameData").update({
					lastAction: {
						username: user.username,
						action: "Fold",
						amount: 0,
					},
					lastWinner: {
						amountWinned: salaData.gameData.pot,
						username: salaData.gameData.infoUsers[userWinnerIndex].username,
					},
					lastActionTime: new Date().getTime(),
					hasBet: false,
					pot: 0,
				});

				await salaRefRTDB.child("publicData").update({
					roomState: "waiting",
				});

				// Actualizamos el hasFolded de todos los usuarios...
				let newUsersWithoutFold = salaData.gameData.infoUsers.map((u) => {
					return {
						...u,
						hasFolded: false,
						isTurn: false,
					};
				});

				await salaRefRTDB.child("gameData").update({
					infoUsers: newUsersWithoutFold,
				});

				// actualizar cartas para sea un array vacio
				let usersCards = {};
				let usersUIDs = salaData.publicData.users.map((user) => user.userUID);
				usersUIDs.forEach((userUID) => {
					usersCards[userUID] = [];
				});

				await salaRefRTDB.update({
					usersCards: usersCards,
				});
			}
			// Si no, se actualiza el hasFolded del jugador
			else {
				let userIndex = salaData.gameData.infoUsers.findIndex(
					(u) => u.userUID == user.uid,
				);
				let nextTurnIndex = null;

				if (userIndex == -1) {
					throw new Error("Error al encontrar al usuario");
				}

				await salaRefRTDB
					.child(`gameData/infoUsers/${userIndex}/bet`)
					.transaction((actual) => 0);

				// Encontrar el usuario que sigue para darle su turno
				for (let i = 1; i < salaData.gameData.infoUsers.length; i++) {
					let candidateIndex =
						(userIndex + i) % salaData.gameData.infoUsers.length;
					let user = salaData.gameData.infoUsers[candidateIndex];
					if (!user.hasFolded) {
						nextTurnIndex = candidateIndex;
						break;
					}
				}

				await salaRefRTDB.child(`gameData/infoUsers/${userIndex}`).update({
					hasFolded: true,
					hasActed: true,
					isTurn: false,
				});

				let updatedSnapshot = await salaRefRTDB.once("value");
				let updatedData = updatedSnapshot.val();

				if (updatedData.gameData.infoUsers.every((u) => u.hasActed == true)) {
					let nextGameStateFunctionResponse = await nextGameState({
						user,
						roomID,
					});
					return nextGameStateFunctionResponse;
				} else {
					await salaRefRTDB
						.child(`gameData/infoUsers/${nextTurnIndex}`)
						.update({
							isTurn: true,
							turnInit: new Date().getTime(),
						});

					return {
						statusCode: 201,
						body: JSON.stringify({
							message: "Folded",
						}),
					};
				}
			}

			return {
				statusCode: 201,
				body: JSON.stringify({
					message: usersNotFolded,
				}),
			};
		}

		// Si un usuario hace call
		if (action == "Call") {
			amount = Number(amount);

			let userIndex = salaData.gameData.infoUsers.findIndex(
				(u) => u.userUID == user.uid,
			);
			if (userIndex === -1) {
				throw new Error("Error al encontrar al usuario");
			}

			// All-In Logic
			if (amount == salaData.gameData.infoUsers[userIndex].fichasInGame) {
				// Aca se crearia un sidepot

				return {
					statusCode: 201,
					body: JSON.stringify({
						message: "All-in Call",
					}),
				};
			}

			// Logica para sumar y restar fichas en juego
			await salaRefRTDB.child(`gameData/infoUsers/${userIndex}`).update({
				fichasInGame:
					salaData.gameData.infoUsers[userIndex].fichasInGame - amount,
				hasActed: true,
			});

			await salaRefRTDB
				.child(`publicData/users/${userIndex}/fichasInGame`)
				.transaction((actual) => (actual || 0) - amount);

			await salaRefRTDB
				.child(`gameData/infoUsers/${userIndex}/bet`)
				.transaction((actual) => (actual || 0) + amount);

			let updatedSnapshot = await salaRefRTDB.once("value");
			let updatedData = updatedSnapshot.val();

			await salaRefRTDB.child("gameData").update({
				lastAction: {
					username: user.username,
					action: "Call",
					amount: amount,
				},
				lastActionTime: new Date().getTime(),
				pot: Number(salaData.gameData.pot) + amount,
			});

			// Si todos los usuarios hasActed, se pasa al siguiente roomState
			if (updatedData.gameData.infoUsers.every((u) => u.hasActed == true)) {
				let nextGameStateFunctionResponse = await nextGameState({
					user,
					roomID,
				});
				return nextGameStateFunctionResponse;
			}

			// Logica para pasar al siguiente turno
			let nextUserTurnIndex = null;

			for (let i = 1; i < updatedData.gameData.infoUsers.length; i++) {
				let candidateIndex =
					(userIndex + i) % updatedData.gameData.infoUsers.length;
				let user = updatedData.gameData.infoUsers[candidateIndex];
				if (!user.hasFolded) {
					nextUserTurnIndex = candidateIndex;
					break;
				}
			}

			await salaRefRTDB.child(`gameData/infoUsers/${userIndex}`).update({
				hasActed: true,
				isTurn: false,
			});

			await salaRefRTDB
				.child(`gameData/infoUsers/${nextUserTurnIndex}`)
				.update({
					isTurn: true,
					turnInit: new Date().getTime(),
				});

			return {
				statusCode: 201,
				body: JSON.stringify({
					message: "Call realizado correctamente",
				}),
			};
		}

		// Si el usuario hace check
		if (action == "Check") {
			let userIndex = salaData.gameData.infoUsers.findIndex(
				(u) => u.userUID == user.uid,
			);

			if (userIndex === -1) {
				throw new Error("Error al encontrar al usuario");
			}

			let userChecked = salaData.gameData.infoUsers[userIndex];

			await salaRefRTDB.child(`gameData/infoUsers/${userIndex}`).update({
				hasActed: true,
				isTurn: false,
			});

			const updatedSnapshot = await salaRefRTDB.once("value");
			const updatedData = updatedSnapshot.val();

			await salaRefRTDB.child("gameData").update({
				lastAction: {
					username: user.username,
					action: "Check",
					amount: 0,
				},
				lastActionTime: new Date().getTime(),
			});

			// si todos los jugadores actuaron, pasamos a la siguiente ronda
			if (updatedData.gameData.infoUsers.every((u) => u.hasActed == true)) {
				let nextGameStateFunctionResponse = await nextGameState({
					user,
					roomID,
				});
				return nextGameStateFunctionResponse;
			} else {
				// Logica para pasar al siguiente turno
				let nextUserTurnIndex = null;

				for (let i = 1; i < updatedData.gameData.infoUsers.length; i++) {
					let candidateIndex =
						(userIndex + i) % updatedData.gameData.infoUsers.length;
					let user = updatedData.gameData.infoUsers[candidateIndex];
					if (!user.hasFolded) {
						nextUserTurnIndex = candidateIndex;
						break;
					}
				}

				await salaRefRTDB
					.child(`gameData/infoUsers/${nextUserTurnIndex}`)
					.update({
						isTurn: true,
						turnInit: new Date().getTime(),
					});
			}

			return {
				statusCode: 201,
				body: JSON.stringify({
					message: "Check",
				}),
			};
		}

		// Si el usuario hace una bet
		if (action == "Bet" || action == "Raise") {
			let userIndex = salaData.gameData.infoUsers.findIndex(
				(u) => u.userUID == user.uid,
			);
			if (userIndex === -1) {
				throw new Error("Error al encontrar al usuario");
			}

			if (action == "Bet") {
				amount = Number(amount);
			} else {
				amount =
					Number(amount) - Number(salaData.gameData.infoUsers[userIndex].bet);
			}

			// Resetear hasActed a false para todos los usuarios que no hayan foldeado
			for (let i = 0; i < salaData.gameData.infoUsers.length; i++) {
				if (i == userIndex) {
					let fichasInGameNow = Number(
						salaData.gameData.infoUsers[i].fichasInGame,
					);
					await salaRefRTDB.child(`gameData/infoUsers/${i}`).update({
						fichasInGame: fichasInGameNow - amount,
						hasActed: true,
						isTurn: false,
					});
					continue;
				}
				if (!salaData.gameData.infoUsers[i].hasFolded) {
					await salaRefRTDB.child(`gameData/infoUsers/${i}`).update({
						hasActed: false,
					});
				}
			}

			let userActualBet = salaData.gameData.infoUsers[userIndex].bet;

			await salaRefRTDB
				.child(`gameData/infoUsers/${userIndex}/bet`)
				.transaction((actual) => (actual || 0) + amount);

			// Establecer currentBet
			if (action == "Bet") {
				await salaRefRTDB
					.child("gameData/currentBet")
					.transaction((actual) => (actual || 0) + amount);
			} else {
				await salaRefRTDB
					.child("gameData/currentBet")
					.transaction(
						(actual) => amount + salaData.gameData.infoUsers[userIndex].bet,
					);
			}

			// Logica para sumar y restar fichas en juego
			await salaRefRTDB
				.child(`publicData/users/${userIndex}/fichasInGame`)
				.transaction((actual) => (actual || 0) - amount);

			await salaRefRTDB.child(`gameData/infoUsers/${userIndex}`).update({
				fichasInGame:
					salaData.gameData.infoUsers[userIndex].fichasInGame - amount,
				hasActed: true,
			});

			await salaRefRTDB
				.child("gameData/pot")
				.transaction((actual) => (actual || 0) + amount);

			await salaRefRTDB.child("gameData").update({
				lastAction: {
					username: user.username,
					action: action,
					amount: amount,
				},
				lastActionTime: new Date().getTime(),
				hasBet: true,
				pot: Number(salaData.gameData.pot) + amount,
			});

			// Pasar el turno al siguiente jugador
			let nextUserTurnIndex = null;

			for (let i = 1; i < salaData.gameData.infoUsers.length; i++) {
				let candidateIndex =
					(userIndex + i) % salaData.gameData.infoUsers.length;
				let user = salaData.gameData.infoUsers[candidateIndex];
				if (!user.hasFolded) {
					nextUserTurnIndex = candidateIndex;
					break;
				}
			}

			await salaRefRTDB
				.child(`gameData/infoUsers/${nextUserTurnIndex}`)
				.update({
					isTurn: true,
					turnInit: new Date().getTime(),
				});

			return {
				statusCode: 201,
				body: JSON.stringify({
					message: "Bet realizado correctamente",
				}),
			};
		}

		return {
			statusCode: 201,
			body: JSON.stringify({
				message: `Acción realizada correctamente -- ${action} por ${amount}`,
			}),
		};
	} catch (err) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				message: err.message,
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

	// Lista de metodos soportados.
	switch (body.method) {
		case "startGame":
			const startGameFunction = await startGame({
				user,
				roomID: body.roomID,
			});
			return startGameFunction;
		case "handleUserAction":
			const handleActionFunction = await handleUserAction({
				user,
				roomID: body.roomID,
				action: body.action,
				amount: body.amount,
			});
			return handleActionFunction;
		default:
			return {
				statusCode: 400,
				body: JSON.stringify({
					message: "Metodo no soportado",
				}),
			};
	}
};
