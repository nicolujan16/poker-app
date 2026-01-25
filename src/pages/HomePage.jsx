import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig.js";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getUsername } from "../validation/validations.js";
import { Helmet } from "react-helmet";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Plus, Users, Spade, Diamond, Club, Heart } from "lucide-react";
import UserHeader from "../components/UserHeader";
import LobbyButton from "../components/LobbyButton";
import ChipsModal from "../components/ChipsModal";
import CreateRoomModal from "../components/CreateRoomModal";
import JoinRoomModal from "../components/JoinRoomModal";

export default function HomePage() {
	const [isChipsModalOpen, setIsChipsModalOpen] = useState(false);
	const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
	const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);

	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState("");
	// const [crearSalaModal, setCrearSalaModal] = useState(false);
	// const [listaSalaModalState, setListaSalaModalState] = useState(false);
	// const [settingsModal, setSettingsModal] = useState(false);
	// const [mostrarFichasModal, setMostrarFichasModal] = useState(false);
	// const [salas, setSalas] = useState([{ cargando: true }]);
	const navigate = useNavigate();

	// Verificamos que la sesión este iniciada, en caso de que no lo volvemos al login.
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				navigate("/");
			} else {
				getUsername(user)
					.then((response) => {
						if (response.uid) {
							setUser(response);
						} else {
							setUser("");
						}
					})
					.then(() => {
						setLoading(false);
					});
			}
		});

		return () => unsubscribe();
	}, [navigate]);

	const handleRoomCreated = (e) => {
		console.log("handleRoomCreated");
		console.log(e);
	};

	const handleCreateRoomClick = (e) => {
		e.preventDefault();
		setIsCreateRoomModalOpen(true);
	};

	const handleJoinRoomClick = (e) => {
		e.preventDefault();
	};

	// Pantalla de carga...
	if (loading) {
		return (
			<div className="loading-spinner--container">
				<div className="loading-spinner"></div>
				<p>Cargando datos...</p>
			</div>
		);
	}

	return (
		<>
			<Helmet>
				<title>Pokernauta - Lobby Principal</title>
				<meta
					name="description"
					content="Bienvenido al lobby de Pokernauta. Crea o únete a una sala de poker"
				/>
			</Helmet>

			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
				<UserHeader onChipsClick={() => setIsChipsModalOpen(true)} />

				{/* Main Content */}
				<main className="max-w-7xl mx-auto px-6 py-16">
					{/* Decorative Background Elements */}
					<div className="absolute inset-0 overflow-hidden pointer-events-none">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
							className="absolute top-1/4 left-1/4 text-amber-500/5"
						>
							<Spade className="w-64 h-64" />
						</motion.div>
						<motion.div
							animate={{ rotate: -360 }}
							transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
							className="absolute top-1/3 right-1/4 text-red-500/5"
						>
							<Heart className="w-48 h-48" />
						</motion.div>
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
							className="absolute bottom-1/4 left-1/3 text-amber-500/5"
						>
							<Diamond className="w-56 h-56" />
						</motion.div>
						<motion.div
							animate={{ rotate: -360 }}
							transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
							className="absolute bottom-1/3 right-1/3 text-green-500/5"
						>
							<Club className="w-40 h-40" />
						</motion.div>
					</div>

					{/* Welcome Section */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center mb-16 relative z-10"
					>
						<h1 className="text-5xl font-bold text-white mb-4">
							Bienvenido al Lobby
						</h1>
						<p className="text-gray-400 text-xl">Elige tu próxima jugada</p>
					</motion.div>

					{/* Action Buttons */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10"
					>
						<LobbyButton
							icon={Plus}
							onClick={handleCreateRoomClick}
							variant="primary"
						>
							Crear Sala
						</LobbyButton>

						<LobbyButton
							icon={Users}
							onClick={handleJoinRoomClick}
							variant="secondary"
						>
							Unirse a Sala
						</LobbyButton>
					</motion.div>

					{/* Stats or Info Section */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10"
					>
						{[
							{ label: "Salas Activas", value: "13" },
							{ label: "Jugadores Online", value: "258" },
							{ label: "Torneos Hoy", value: "5" },
						].map((stat, index) => (
							<motion.div
								key={stat.label}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5 + index * 0.1 }}
								className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 text-center border border-gray-700 hover:border-amber-500/50 transition-all duration-300"
							>
								<p className="text-gray-400 text-sm mb-2">{stat.label}</p>
								<p className="text-3xl font-bold text-amber-500">
									{stat.value}
								</p>
							</motion.div>
						))}
					</motion.div>
				</main>

				<ChipsModal
					isOpen={isChipsModalOpen}
					onClose={() => setIsChipsModalOpen(false)}
				/>

				<CreateRoomModal
					isOpen={isCreateRoomModalOpen}
					onClose={() => setIsCreateRoomModalOpen(false)}
					onCreateRoom={handleRoomCreated}
					currentUser={user}
				/>

				<JoinRoomModal
					isOpen={isJoinRoomModalOpen}
					onClose={() => setIsJoinRoomModalOpen(false)}
				/>
			</div>
		</>
	);
}

// {/* <div className="home--main-container">
// 				<div className="home--main-box">
// 					{/* header */}
// 					<header className="home--header">
// 						{/* Header parte izq */}
// 						<div className="home--header__username">
// 							<b>{user.username}</b>
// 							<div
// 								style={{ cursor: "pointer" }}
// 								onClick={() => {
// 									setMostrarFichasModal(true);
// 								}}
// 							>
// 								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
// 									<circle
// 										cx="32"
// 										cy="32"
// 										r="30"
// 										fill="#388E3C"
// 										stroke="#1B5E20"
// 										strokeWidth="4"
// 									/>
// 									<circle cx="32" cy="32" r="20" fill="#FFFFFF" />
// 									<circle cx="32" cy="32" r="10" fill="#388E3C" />
// 									<path
// 										d="M32 2v8M32 54v8M2 32h8M54 32h8M11.3 11.3l5.7 5.7M47 47l5.7 5.7M11.3 52.7l5.7-5.7M47 17l5.7-5.7"
// 										stroke="#FFFFFF"
// 										strokeWidth="4"
// 									/>
// 								</svg>
// 								{user.fichas}
// 							</div>
// 						</div>
// 						{/* Header parte derecha */}
// 						<div className="home--header__config">
// 							<svg
// 								xmlns="http://www.w3.org/2000/svg"
// 								className="svg"
// 								fill="none"
// 								viewBox="0 0 24 24"
// 								stroke="currentColor"
// 								strokeWidth={2}
// 								onClick={() => {
// 									setSettingsModal(true);
// 								}}
// 							>
// 								<path
// 									strokeLinecap="round"
// 									strokeLinejoin="round"
// 									d="M11.25 3v1.636a8.003 8.003 0 00-2.25.78L7.5 4.5 5.379 6.621l.917 1.5a8.003 8.003 0 00-.78 2.25H3v3h1.636a8.003 8.003 0 00.78 2.25l-0.917 1.5L7.5 19.5l1.5-.917a8.003 8.003 0 002.25.78V21h3v-1.636a8.003 8.003 0 002.25-.78l1.5.917 2.121-2.121-0.917-1.5a8.003 8.003 0 00.78-2.25H21v-3h-1.636a8.003 8.003 0 00-.78-2.25l0.917-1.5L16.5 4.5l-1.5.917a8.003 8.003 0 00-2.25-.78V3h-1.5zM12 15a3 3 0 100-6 3 3 0 000 6z"
// 								/>
// 							</svg>
// 							<svg
// 								onClick={handleLogOut}
// 								xmlns="http://www.w3.org/2000/svg"
// 								className="svg logOut-svg"
// 								fill="none"
// 								viewBox="0 0 24 24"
// 								stroke="currentColor"
// 								strokeWidth={2}
// 							>
// 								<path
// 									strokeLinecap="round"
// 									strokeLinejoin="round"
// 									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
// 								/>
// 							</svg>
// 						</div>
// 					</header>
// 					{/* main */}
// 					<div className="home--main">
// 						<button
// 							onClick={() => {
// 								setCrearSalaModal(true);
// 							}}
// 						>
// 							Crear Sala
// 						</button>
// 						<button
// 							onClick={() => {
// 								setListaSalaModalState(true);
// 							}}
// 						>
// 							Unise a Sala
// 						</button>
// 					</div>
// 				</div>

// 				{/*-------- modales -------- */}
// 				{(crearSalaModal || settingsModal || mostrarFichasModal) && (
// 					<div className="home-modal--container">
// 						<div className="home-modal--box">
// 							<div
// 								className="exit-modal-btn"
// 								onClick={() => {
// 									setCrearSalaModal(false);
// 									setListaSalaModalState(false);
// 									setSettingsModal(false);
// 									setMostrarFichasModal(false);
// 								}}
// 							>
// 								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
// 									<path
// 										d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"
// 										fill="currentColor"
// 									/>
// 								</svg>
// 							</div>
// 							{/* Form Crear Sala */}
// 							{crearSalaModal && <CrearSalaModal user={user} />}

// 							{settingsModal && <SettingsModal handleLogOut={handleLogOut} />}
// 							{mostrarFichasModal && (
// 								<MostrarFichasModal user={user} setUser={setUser} />
// 							)}
// 						</div>
// 					</div>
// 				)}
// 				{listaSalaModalState && (
// 					<ListaSalaModal
// 						salas={salas}
// 						setSalas={setSalas}
// 						user={user}
// 						setCrearSalaModal={setCrearSalaModal}
// 						setListaSalaModalState={setListaSalaModalState}
// 					/>
// 				)}
// 			</div> */}
