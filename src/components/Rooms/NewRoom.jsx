import { useEffect, useState } from "react";
import { auth, RTDB } from "../../firebaseConfig";
// eslint-disable-next-line no-unused-vars
import { motion, scale } from "framer-motion";
import { Spade, Heart, ArrowLeft, Trophy, Users } from "lucide-react"; // Agregué iconos útiles
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getUsername } from "../../validation/validations";
import RoomControls from "./RoomControls/RoomControls";
import Swal from "sweetalert2";
import { leaveSala, eliminarSala } from "../../logic/logic.js";
import { off, onValue, ref } from "firebase/database";
import PlayerCard from "./PlayerCard.jsx";
import { startGame, userAction } from "../../logic/engine.js";
import { cardsPosition } from "../../utils/cardImagePosition.js";
import LoadingScreen from "../LoadingScreen";

// Importamos la imagen del mazo para usarla en inline styles o tailwind config si prefieres
import mazoPoker from "../../assets/mazoPoker.png";

export default function NewRoom() {
	const navigate = useNavigate();

	const [user, setUser] = useState({});
	const [loadingData, setLoadingData] = useState(true);
	const [searchParams] = useSearchParams();
	const [players, setPlayers] = useState([]);
	const [infoSala, setInfoSala] = useState({});
	const [gameData, setGameData] = useState({});
	const [playerCards, setPlayerCards] = useState(null);
	const [activeListeners, setActiveListeners] = useState([]);

	const isAdmin = user?.username === infoSala?.admin;

	// suscribir a RTDB:Cards
	useEffect(() => {
		if (
			!infoSala.nombreSala ||
			infoSala.roomState == "waiting" ||
			!user ||
			loadingData
		)
			return;

		try {
			const gameDataRef = ref(
				RTDB,
				`salas/${infoSala.nombreSala}/usersCards/${user.uid}`,
			);

			// Suscribirse a CARTAS
			const unsubscribe = onValue(gameDataRef, (snapshot) => {
				const data = snapshot.val();
				setPlayerCards(data);
			});

			setActiveListeners((prev) => [
				...prev,
				{ ref: gameDataRef, callback: unsubscribe },
			]);

			// Cleanup: desuscribirse
			return () => {
				off(gameDataRef, "value", unsubscribe);
			};
		} catch (err) {
			Swal.fire({
				title: "Error obteniendo cartas",
				text: err,
				background: "#222",
				color: "#fff",
			});
		}
	}, [infoSala, user, loadingData]);

	// obtener user
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				navigate("/");
			} else {
				getUsername(user).then((response) => {
					if (response.uid) {
						setUser({ ...response });
					} else {
						setUser(null);
					}
				});
			}
		});

		return () => unsubscribe();
	}, [navigate]);

	// suscribir a RTDB:Sala
	useEffect(() => {
		const salaID = searchParams.get("id");
		if (!salaID) {
			navigate("/");
			return;
		}

		// Referencia a publicData
		const publicDataRef = ref(RTDB, `salas/${salaID}/publicData`);

		const unsubscribe = onValue(
			publicDataRef,
			(snapshot) => {
				const data = snapshot.val();
				if (data) {
					setInfoSala(data);
					setPlayers(data.users || []);
				} else {
					// Si la sala no existe
					Swal.fire({
						icon: "error",
						title: "Sala no encontrada",
						text: "La sala que intentas acceder no existe o fue eliminada.",
						showConfirmButton: true,
						confirmButtonText: "Volver al lobby",
						background: "#222",
						color: "#fff",
					}).then(() => navigate("/home"));
				}
			},
			(error) => {
				console.error(error);
				Swal.fire({
					icon: "error",
					title: "Error de conexión",
					text: "No se pudo conectar con la sala.",
					background: "#222",
					color: "#fff",
				});
				setLoadingData(false);
			},
		);

		setActiveListeners((prev) => [
			...prev,
			{ ref: publicDataRef, callback: unsubscribe },
		]);

		// Cleanup
		return () => {
			off(publicDataRef, "value", unsubscribe);
		};
	}, [searchParams, navigate]);

	// suscribir a RTDB:GameData
	useEffect(() => {
		const salaID = searchParams.get("id");
		if (!salaID) {
			navigate("/");
			return;
		}
		// Referencia a gameData
		const gameDataRef = ref(RTDB, `salas/${salaID}/gameData`);

		const unsubscribe = onValue(
			gameDataRef,
			(snapshot) => {
				let dataGame = snapshot.val();
				if (dataGame) {
					setGameData({ ...dataGame });
				}
			},
			(error) => {
				console.error(error);
				Swal.fire({
					icon: "error",
					title: "Error de conexión",
					text: "No se pudo conectar con la sala.",
					background: "#222",
					color: "#fff",
				});
			},
		);

		setActiveListeners((prev) => [
			...prev,
			{ ref: gameDataRef, callback: unsubscribe },
		]);

		// Cleanup
		return () => {
			off(gameDataRef, "value", unsubscribe);
		};
	}, [searchParams, navigate]);

	// Ordenar jugadores para que nosotros estemos abajo al medio siempre
	useEffect(() => {
		if (!players || players.length === 0 || !user) {
			return;
		}

		const index = players.findIndex((p) => p.userUID === user.uid);
		if (index == -1) return;

		if (index !== 0) {
			const jugadoresOrdenados = [
				...players.slice(index),
				...players.slice(0, index),
			];

			setPlayers(jugadoresOrdenados);
		}
		setLoadingData(false);
	}, [players, user]);

	// Pantalla de carga
	if (loadingData) {
		return <LoadingScreen message="Conectando a la sala..." />;
	}

	// Limpiar toda la suscripcion a RTDB
	const cleanupListeners = () => {
		activeListeners.forEach(({ ref, callback }) => {
			off(ref, "value", callback);
		});
		setActiveListeners([]); // Limpiar la lista
	};

	const handleBackToLobby = async (e) => {
		if (infoSala.roomState == "waiting") {
			if (isAdmin) {
				Swal.fire({
					title: "Estas seguro que desea salir?",
					text: "La sala actual sera eliminada",
					showConfirmButton: true,
					showDenyButton: true,
					showCancelButton: true,
					cancelButtonText: "Cancelar",
					confirmButtonText: "Salir y eliminar sala",
					denyButtonText: `Salir y mantener sala`,
					background: "#222",
					color: "#fff",
				}).then((result) => {
					if (result.isConfirmed) {
						Swal.fire({
							title: "Eliminando sala...",
							text: "Por favor espera",
							allowOutsideClick: false,
							background: "#222",
							color: "#eee",
							didOpen: () => {
								Swal.showLoading();
							},
						});
						eliminarSala({ roomName: infoSala.nombreSala })
							.then(() => {
								Swal.close({});
								Swal.fire({
									title: "Sala eliminada",
									showConfirmButton: true,
									showCancelButton: false,
									confirmButtonText: "Volver al lobby",
									background: "#222",
									color: "#fff",
								}).then((result) => {
									if (result.isConfirmed) {
										cleanupListeners();
										navigate("/home");
									}
								});
							})
							.catch((err) => {
								Swal.fire({
									title: "Error eliminando sala",
									text: err.message,
									background: "#222",
									color: "#fff",
								});
							});
					}
					if (result.isDenied) {
						navigate("/home");
					}
				});
			} else {
				Swal.fire({
					title: "Estas seguro que desea salir?",
					showDenyButton: true,
					confirmButtonText: "Salir",
					denyButtonText: `No Salir`,
					background: "#222",
					color: "#fff",
				}).then((result) => {
					if (result.isConfirmed) {
						Swal.fire({
							title: `Saliendo de sala`,
							text: "Juntando fichas...",
							allowOutsideClick: false,
							background: "#222",
							color: "#eee",
							didOpen: () => {
								Swal.showLoading();
							},
						});
						let roomID = infoSala.nombreSala;
						leaveSala({ roomID }).then((data) => {
							if (data.status == 200) {
								Swal.close({});
								cleanupListeners();
								navigate("/home");
							} else {
								Swal.close({});
								Swal.fire({
									icon: "error",
									title: "Error saliendo de la sala",
									text: data.message,
									background: "#222",
									color: "#fff",
								});
							}
						});
					}
				});
			}
			e.preventDefault();
			return;
		}
		if (
			(infoSala.roomState !== "waiting") &
			(infoSala.roomState !== "starting")
		) {
			if (isAdmin) {
				Swal.fire({
					title: "Estas seguro que desea salir?",
					text: "La sala actual sera eliminada",
					showConfirmButton: true,
					showDenyButton: true,
					showCancelButton: true,
					cancelButtonText: "Cancelar",
					confirmButtonText: "Salir y eliminar sala",
					denyButtonText: `Salir y mantener sala`,
					background: "#222",
					color: "#fff",
				}).then((result) => {
					if (result.isConfirmed) {
						Swal.fire({
							title: "Eliminando sala...",
							text: "Por favor espera",
							allowOutsideClick: false,
							background: "#222",
							color: "#eee",
							didOpen: () => {
								Swal.showLoading();
							},
						});
						eliminarSala({ roomName: infoSala.nombreSala })
							.then(() => {
								Swal.close({});
								Swal.fire({
									title: "Sala eliminada",
									showConfirmButton: true,
									showCancelButton: false,
									confirmButtonText: "Volver al lobby",
									background: "#222",
									color: "#fff",
								}).then((result) => {
									if (result.isConfirmed) {
										cleanupListeners();
										navigate("/home");
									}
								});
							})
							.catch((err) => {
								Swal.fire({
									title: "Error eliminando sala",
									text: err.message,
									background: "#222",
									color: "#fff",
								});
							});
					}
					if (result.isDenied) {
						cleanupListeners();
						navigate("/home");
					}
				});
			} else {
				Swal.fire({
					title: "Estas seguro que desea salir?",
					text: "Se foldeara la mano actual",
					showDenyButton: true,
					confirmButtonText: "Salir",
					denyButtonText: `No Salir`,
					background: "#222",
					color: "#fff",
				}).then((res) => {
					if (res.isConfirmed) {
						Swal.fire({
							title: `Saliendo de sala`,
							text: "Foldeando mano y juntando fichas...",
							allowOutsideClick: false,
							background: "#222",
							color: "#eee",
							didOpen: () => {
								Swal.showLoading();
							},
						});
						try {
							userAction({
								roomID: infoSala.nombreSala,
								action: "Fold",
							}).then((res) => {
								if (res.status == 200) {
									leaveSala({ roomID: infoSala.nombreSala }).then((res) => {
										if (res.status == 200) {
											Swal.close();
											navigate("/home");
										} else {
											throw new Error("Leaving room error");
										}
									});
								} else {
									throw new Error("User Action Error");
								}
							});
						} catch (err) {
							Swal.fire({
								icon: "error",
								title: "Error dejando la sala",
								text: err.message,
							});
						}
					}
				});
			}
			//
		}
	};

	const handleStartGame = async (e) => {
		e.preventDefault();
		// FUNCION PARA INICIAR SALA...
		startGame({
			roomID: infoSala.nombreSala,
		}).then((data) => {
			if (data.status != 200) {
				Swal.fire({
					title: "Error iniciando juego. Intente nuevamente.",
					text: data.message,
					icon: "error",
					background: "#222",
					color: "#fff",
				});
			}
		});
	};

	return (
		<div className="relative w-screen h-screen flex flex-col justify-center items-center bg-[#0a0a0a] text-white overflow-hidden">
			{/* FONDO IMAGEN + GRADIENTE */}
			<div
				className="absolute inset-0 z-0"
				style={{
					backgroundImage:
						"url(https://images.unsplash.com/photo-1643200350893-0f386c79e0be)",
					backgroundSize: "cover",
					backgroundPosition: "center",
					filter: "brightness(0.3)",
				}}
			/>
			<div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-black/80 to-gray-900/90 z-0" />

			{/* ELEMENTOS DECORATIVOS FLOTANTES */}
			<motion.div
				animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
				transition={{ duration: 6, repeat: Infinity }}
				className="absolute top-20 left-10 text-amber-500/20 pointer-events-none"
			>
				<Spade className="w-24 h-24" />
			</motion.div>
			<motion.div
				animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
				transition={{ duration: 8, repeat: Infinity }}
				className="absolute bottom-20 right-10 text-red-500/20 pointer-events-none"
			>
				<Heart className="w-24 h-24" />
			</motion.div>

			{/* BOTÓN VOLVER (back-to-lobby--btn) */}
			{infoSala.roomState !== "starting" && (
				<button
					title="Volver al lobby"
					className="absolute top-4 left-4 z-50 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white p-2.5 rounded-lg border border-gray-600 transition-all shadow-lg backdrop-blur-sm"
					onClick={handleBackToLobby}
				>
					<ArrowLeft className="w-6 h-6" />
				</button>
			)}

			{/* MESA DE POKER (main-table--container) */}
			<div className="relative w-[95%] md:w-[80%] h-[60%] md:h-[70%] bg-[#6b0f1a] rounded-[100px] md:rounded-[200px] border-[15px] md:border-[20px] border-[#4e342e] shadow-[0_0_50px_rgba(0,0,0,0.6)] z-20 flex items-center justify-center">
				{/* Renderizamos jugadores */}
				{players.map((player, playerIndex) => (
					<PlayerCard
						key={playerIndex}
						players={players}
						player={player}
						playerIndex={playerIndex}
						playerCards={playerIndex === 0 ? playerCards : false}
						infoSala={infoSala}
						gameData={gameData || false}
					/>
				))}
			</div>

			{/* ---- ESTADO: WAITING/STARTING (room-waiting-players--container) ---- */}
			{(infoSala.roomState == "waiting" ||
				infoSala.roomState == "starting") && (
				<div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="flex flex-col gap-6 text-lg bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl items-center max-w-md w-full mx-4">
						{infoSala.roomState == "starting" ? (
							<div className="flex flex-col items-center gap-4">
								<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
								<p className="text-amber-500 font-bold animate-pulse">
									Repartiendo cartas...
								</p>
							</div>
						) : (
							<>
								<div className="w-full space-y-4 text-center">
									{/* Último Ganador */}
									{gameData?.lastWinner && (
										<div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
											{gameData?.lastAction?.action != "Fold" ? (
												<div className="flex flex-col gap-1">
													<span className="text-amber-400 font-bold flex items-center justify-center gap-2">
														<Trophy className="w-4 h-4" /> Ganador:{" "}
														{gameData.lastWinner.username}
													</span>
													<span className="text-sm text-gray-400">
														Mano: {gameData.lastWinner.handName}
													</span>
												</div>
											) : (
												<div className="text-sm">
													<span className="font-bold text-gray-300">
														{gameData.lastWinner.username}
													</span>{" "}
													ganó el pozo de{" "}
													<span className="text-amber-500 font-bold">
														{gameData.lastWinner.amountWinned}
													</span>{" "}
													fichas
												</div>
											)}
										</div>
									)}

									{/* Estado de Jugadores */}
									<div className="py-2">
										{infoSala?.users?.length == infoSala?.maxPlayers ? (
											<p className="text-gray-300">
												Esperando al administrador para iniciar...
											</p>
										) : (
											<div className="flex flex-col items-center gap-2">
												<Users className="w-8 h-8 text-gray-500" />
												<p className="text-gray-300">Esperando jugadores...</p>
												<span className="bg-gray-800 text-amber-500 px-3 py-1 rounded-full text-sm font-bold border border-gray-700">
													{infoSala.users.length} / {infoSala.maxPlayers}
												</span>
											</div>
										)}
									</div>
								</div>

								{/* Botón Admin */}
								{(infoSala.users.length > 1) & isAdmin ? (
									<button
										onClick={handleStartGame}
										className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-bold py-3 px-6 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform hover:scale-105"
									>
										Comenzar Ronda
									</button>
								) : (
									isAdmin && (
										<p className="text-xs text-gray-500">
											Se necesitan al menos 2 jugadores
										</p>
									)
								)}
							</>
						)}
					</div>
				</div>
			)}

			{/* ---- ESTADO: PREFLOP/GAME (cards-nd-pot--info-container) ---- */}
			{gameData.pot > 0 && (
				<div className="absolute top-[40%] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center justify-center gap-2 pointer-events-none">
					<div className="flex gap-2 md:gap-3">
						{gameData?.communityCards?.map((card) => (
							<div
								key={card}
								className="w-[70.769px] h-[99.25px] rounded-lg shadow-2xl border border-black/20"
								style={{
									...cardsPosition[card],
									backgroundImage: `url(${mazoPoker})`,
								}}
							></div>
						))}
					</div>
					<div className="bg-black/60 border border-amber-500/30 px-4 py-1 rounded-full backdrop-blur-md mb-2">
						<p className="text-amber-400 font-bold font-mono tracking-wider">
							Pozo: ${gameData.pot}
						</p>
					</div>
				</div>
			)}

			{/* CONTROLES */}
			{infoSala.roomState !== "waiting" && (
				<div className="relative z-50">
					<RoomControls
						infoSala={infoSala}
						players={players}
						user={user}
						gameData={gameData || {}}
					/>
				</div>
			)}
		</div>
	);
}
