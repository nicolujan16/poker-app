import React, { createContext, useContext, useEffect, useState } from "react";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	browserLocalPersistence,
	browserSessionPersistence,
	setPersistence,
	signInAnonymously,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig.js";
import {
	collection,
	doc,
	getDocs,
	query,
	setDoc,
	updateDoc,
	where,
	increment,
	serverTimestamp,
	onSnapshot,
} from "firebase/firestore";
import Swal from "sweetalert2";
// Asegúrate de que deleteGuest reciba lo que espera (userUID y token)
import { deleteGuest } from "../logic/logic.js";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	return useContext(AuthContext);
}

export function AuthProvider({ children }) {
	const [currentUser, setCurrentUser] = useState(null);
	const [userDataDB, setUserDataDB] = useState(null);

	// 1. Escuchar estado de autenticación (Firebase Auth)
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user);
		});
		return unsubscribe;
	}, []);

	// 2. Escuchar datos del usuario en Firestore (Tiempo Real)
	useEffect(() => {
		let unsubscribeFirestore = null;

		if (currentUser) {
			const userRef = doc(db, "Users", currentUser.uid);

			unsubscribeFirestore = onSnapshot(
				userRef,
				(docSnap) => {
					if (docSnap.exists()) {
						setUserDataDB(docSnap.data());
					} else {
						setUserDataDB(null);
					}
				},
				(error) => {
					console.error("Error escuchando datos del usuario:", error);
				},
			);
		} else {
			setUserDataDB(null);
		}

		// Limpieza al desmontar o al cambiar de usuario (logout)
		return () => {
			if (unsubscribeFirestore) {
				unsubscribeFirestore();
			}
		};
	}, [currentUser]);

	// ------------ REGISTRO ------------
	async function signup({ email, password, username }) {
		if (!username) throw new Error("Username invalido o vacio");

		try {
			const { user } = await createUserWithEmailAndPassword(
				auth,
				email,
				password,
			);

			await setDoc(doc(db, "Users", user.uid), {
				uid: user.uid,
				email,
				username,
				fichas: 15000,
				fichasInGame: 0, // Es buena práctica inicializarlo
				createdAt: new Date(),
				isGuest: false,
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	// Verificamos disponibilidad de username
	async function verifyUsername(username) {
		if (!username) return;
		const q = query(collection(db, "Users"), where("username", "==", username));
		const querySnapshot = await getDocs(q);
		return querySnapshot.empty;
	}

	// ------------ LOGIN ------------
	async function login({ email, password, rememberMe = false }) {
		try {
			const persistenceType = rememberMe
				? browserLocalPersistence
				: browserSessionPersistence;

			await setPersistence(auth, persistenceType);
			return signInWithEmailAndPassword(auth, email, password);
		} catch (err) {
			throw new Error(err);
		}
	}

	// ------------ LOGOUT ------------
	async function logout() {
		if (userDataDB?.isGuest) {
			const result = await Swal.fire({
				title: "¿Abandonar sesión de invitado?",
				text: "¡Cuidado! Al ser una cuenta de invitado, si sales se borrarán tus fichas y progreso permanentemente.",
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#d33",
				cancelButtonColor: "#3085d6",
				confirmButtonText: "Sí, borrar y salir",
				cancelButtonText: "Cancelar",
				background: "#222",
				color: "#eee",
			});

			if (!result.isConfirmed) return;

			Swal.fire({
				title: "Cerrando Sesión...",
				text: "Por favor espera",
				allowOutsideClick: false,
				background: "#222",
				color: "#eee",
				didOpen: () => {
					Swal.showLoading();
				},
			});

			try {
				// Obtenemos el token fresco antes de mandar
				const token = await currentUser.getIdToken();

				// Llamamos a la lambda pasando lo que espera (userUID y token)
				// Asegúrate que tu función en logic.js maneje estos parámetros
				let lambdaFunction = await deleteGuest({
					userUID: currentUser.uid,
					token: token,
				});

				if (
					lambdaFunction.statusCode !== 200 &&
					lambdaFunction.status !== 200
				) {
					throw new Error("Error eliminando usuario invitado");
				}
			} catch (error) {
				console.error("Error limpiando usuario invitado:", error);
			}
		}

		await signOut(auth);
		// Nota: setUserDataDB(null) se hace automático gracias al useEffect cuando currentUser cambia a null
		Swal.close();
		return true;
	}

	// ------------ LOBBY LOGIC ------------

	// Actualizar Fichas
	async function updateChips(chipsDelta, isClaim = false) {
		if (!currentUser || !userDataDB) return;

		try {
			const userRef = doc(db, "Users", currentUser.uid);

			if (isClaim) {
				const lastClaim = userDataDB.lastClaim;
				if (lastClaim) {
					let lastClaimDate;
					if (typeof lastClaim.toDate === "function") {
						lastClaimDate = lastClaim.toDate();
					} else if (lastClaim instanceof Date) {
						lastClaimDate = lastClaim;
					} else {
						lastClaimDate = new Date(lastClaim);
					}

					const now = new Date();
					const diffMs = now - lastClaimDate;
					const diffHours = diffMs / (1000 * 60 * 60);

					if (diffHours < 4) {
						return {
							success: false,
							reason: "CLAIM_NOT_READY",
							remainingMs: 4 * 60 * 60 * 1000 - diffMs,
						};
					}
				}
			}

			// Update en Firestore
			const updateData = {
				fichas: increment(chipsDelta),
			};

			if (isClaim) {
				updateData.lastClaim = serverTimestamp();
			}

			await updateDoc(userRef, updateData);

			// NOTA: Ya no hace falta el setUserDataDB manual aquí abajo porque
			// el onSnapshot del useEffect detectará el updateDoc y actualizará el estado solo.
			// Pero si quieres mantener la UI "optimista" (instantánea antes de red), puedes dejarlo.

			return { success: true };
		} catch (error) {
			console.error("Error actualizando fichas:", error);
			return { success: false, reason: "ERROR" };
		}
	}

	// getRoomsList
	async function getRoomsList() {
		try {
			const querySnapshot = await getDocs(collection(db, "Salas"));
			if (querySnapshot.empty) return [];

			const salas = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));

			return salas;
		} catch (error) {
			return { error: true, message: error };
		}
	}

	// ------------ LOGIN ANONIMO ------------
	const loginAsGuest = async () => {
		try {
			await setPersistence(auth, browserLocalPersistence);
			const userCredential = await signInAnonymously(auth);
			const user = userCredential.user;

			const guestUsername = `Invitado_${user.uid.slice(0, 5)}`;
			const userRef = doc(db, "Users", user.uid);

			await setDoc(userRef, {
				uid: user.uid,
				username: guestUsername,
				email: null,
				fichas: 5000,
				fichasInGame: 0,
				profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestUsername}`,
				createdAt: serverTimestamp(),
				lastClaim: null,
				isGuest: true,
			});

			return { success: true };
		} catch (error) {
			console.error("Error en login de invitado:", error);
			return { success: false, error: error.message };
		}
	};

	const value = {
		verifyUsername,
		loginAsGuest,
		updateChips,
		getRoomsList,
		userDataDB,
		currentUser,
		signup,
		login,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
