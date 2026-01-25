import React, { createContext, useContext, useEffect, useState } from "react";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	browserLocalPersistence,
	browserSessionPersistence,
	setPersistence,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig.js";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	setDoc,
	updateDoc,
	where,
	increment,
	serverTimestamp,
} from "firebase/firestore";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	return useContext(AuthContext);
}

// 3. El componente proveedor
export function AuthProvider({ children }) {
	const [currentUser, setCurrentUser] = useState(null);
	const [userDataDB, setUserDataDB] = useState(null);

	// Persistencia de la sesión (El "escucha" de Firebase)
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user);
		});

		return unsubscribe;
	}, []);

	// Para obtener la data del usuario en la DB
	useEffect(() => {
		const fetchUserData = async () => {
			if (!currentUser) {
				setUserDataDB(null);
				return;
			}

			try {
				const userRef = doc(db, "Users", currentUser.uid);
				const userSnap = await getDoc(userRef);

				if (userSnap.exists()) {
					setUserDataDB(userSnap.data());
				} else {
					setUserDataDB(null);
				}
			} catch (error) {
				console.error("Error al obtener usuario:", error);
			}
		};

		fetchUserData();
	}, [currentUser]);

	// ------------ REGISTRO ------------
	async function signup({ email, password, username }) {
		if (!username) throw new Error("Username invalido o vacio");

		try {
			// creamos el user en auth
			const { user } = await createUserWithEmailAndPassword(
				auth,
				email,
				password,
			);
			// creamos el user en db
			await setDoc(doc(db, "Users", user.uid), {
				uid: user.uid,
				email,
				username,
				fichas: 15000,
				createdAt: new Date(),
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
	function logout() {
		return signOut(auth);
	}

	async function updateChips(chipsDelta, isClaim = false) {
		if (!currentUser || !userDataDB) return;

		try {
			const userRef = doc(db, "Users", currentUser.uid);

			if (isClaim) {
				const lastClaim = userDataDB.lastClaim;

				if (lastClaim) {
					// CORRECCIÓN: Verificar el tipo de objeto antes de convertir
					let lastClaimDate;

					// Si viene de Firebase (tiene el método toDate)
					if (typeof lastClaim.toDate === "function") {
						lastClaimDate = lastClaim.toDate();
					}
					// Si es una actualización local (ya es un objeto Date)
					else if (lastClaim instanceof Date) {
						lastClaimDate = lastClaim;
					}
					// Por seguridad, si es otro formato (string, número) intentamos instanciarlo
					else {
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

			// 🔥 Update en Firestore
			const updateData = {
				fichas: increment(chipsDelta),
			};

			if (isClaim) {
				updateData.lastClaim = serverTimestamp();
			}

			await updateDoc(userRef, updateData);

			// ⚡ Update local
			setUserDataDB((prev) =>
				prev
					? {
							...prev,
							fichas: prev.fichas + chipsDelta,
							...(isClaim && { lastClaim: new Date() }),
						}
					: prev,
			);

			return { success: true };
		} catch (error) {
			console.error("Error actualizando fichas:", error);
			return { success: false, reason: "ERROR" };
		}
	}

	// Objeto con todo lo que vamos a exportar
	const value = {
		verifyUsername,
		updateChips,
		userDataDB,
		currentUser,
		signup,
		login,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
