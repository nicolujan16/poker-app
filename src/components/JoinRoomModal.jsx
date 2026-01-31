import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

// IMPORTS
import JoinRoomButton from "./JoinRoomButton";
import { joinRoom } from "../logic/logic";

const JoinRoomModal = ({ isOpen, onClose, onCreateRoom }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredRooms, setFilteredRooms] = useState([]);
	const [roomsList, setRoomsList] = useState([]);
	const navigate = useNavigate();

	const { getRoomsList, userDataDB } = useAuth();

	// Filtrar salas
	useEffect(() => {
		const results = roomsList.filter((room) =>
			room.name.toLowerCase().includes(searchTerm.toLowerCase()),
		);
		setFilteredRooms(results);
	}, [roomsList, searchTerm]);

	// Obtener salas al abrir el modal
	useEffect(() => {
		if (isOpen) {
			getRoomsList().then((res) => {
				setRoomsList(res);
			});
		}
	}, [getRoomsList, isOpen]);

	// --- LÓGICA DE UNIÓN NUEVA (Volver a la mesa) ---
	const handleRejoin = (roomId) => {
		onClose();
		navigate(`/sala?id=${roomId}`);
	};

	// --- LÓGICA DE UNIÓN ESTÁNDAR ---
	const handleJoinWithLogic = async ({ roomID, password, moneyInGame }) => {
		try {
			if (!userDataDB) throw new Error("No hay usuario autenticado");

			const response = await joinRoom({
				user: userDataDB,
				roomID: roomID,
				buyIn: moneyInGame,
				password: password,
			});

			if (response.statusCode === 200 || response.status === 200) {
				onClose();
				navigate(`/sala?id=${roomID}`);
			} else {
				throw new Error(response.message || "No se pudo unir a la sala");
			}
		} catch (error) {
			console.error(error);
			Swal.fire({
				icon: "error",
				title: "Error al unirse",
				text: error.message,
				background: "#222",
				color: "#eee",
				confirmButtonColor: "#d97706",
			});
			throw error;
		}
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4 sm:p-6">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black/80 backdrop-blur-sm"
					onClick={onClose}
				/>

				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 20 }}
					className="relative w-full max-w-5xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
				>
					{/* Header */}
					<div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-gray-800 bg-gray-900/90 gap-4">
						<div>
							<h2 className="text-2xl font-bold text-white flex items-center gap-2">
								<span className="text-amber-500">Unirse</span> a una Sala
							</h2>
							<p className="text-gray-400 text-sm mt-1">
								Encuentra una mesa y demuestra tus habilidades
							</p>
						</div>

						<div className="flex items-center gap-3 w-full md:w-auto">
							<div className="relative w-full md:w-80 group">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
								<Input
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder="Buscar sala por nombre..."
									className="pl-10 bg-gray-950 border-gray-700 focus:border-amber-500"
								/>
							</div>
							<button
								onClick={onClose}
								className="hidden md:block text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-full transition-colors"
							>
								<X className="w-6 h-6" />
							</button>
						</div>
						<button
							onClick={onClose}
							className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white"
						>
							<X className="w-6 h-6" />
						</button>
					</div>

					{/* Body */}
					<div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-900/50 custom-scrollbar">
						<div className="grid grid-cols-1 gap-4">
							{filteredRooms.length ? (
								filteredRooms.map((room) => {
									// --- VERIFICACIÓN DE USUARIO EN SALA ---
									// Chequeamos si el nombre de usuario está en la lista de usuarios de la sala
									// Usamos optional chaining (?.) por seguridad
									const isUserInRoom =
										userDataDB?.username &&
										room.usersList?.includes(userDataDB.username);

									return (
										<div
											key={room.id}
											className="flex flex-col md:flex-row items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-amber-500/50 transition-colors"
										>
											<div className="w-full md:w-auto mb-4 md:mb-0">
												<div className="font-bold text-white text-lg">
													{room.name}
												</div>
												<div className="text-sm text-gray-400 flex gap-3 mt-1">
													<span>
														Buy-In: ${room.buyInMin} - ${room.buyInMax}
													</span>
													<span className="text-gray-600">|</span>
													<span>
														{room.playersQuantity}/{room.maxPlayers} Jugadores
													</span>
												</div>
											</div>
											<div className="w-full md:w-auto flex justify-end">
												<JoinRoomButton
													room={room}
													onJoin={handleJoinWithLogic}
													onRejoin={handleRejoin} // <--- Nueva función para volver
													isAlreadyInRoom={isUserInRoom} // <--- Nuevo booleano
													userBalance={userDataDB?.fichas || 0}
												/>
											</div>
										</div>
									);
								})
							) : (
								<div className="text-center py-10 space-y-4">
									<p className="text-gray-400">
										No hay salas activas con ese nombre
									</p>
									<Button
										className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-8"
										onClick={() => {
											onCreateRoom();
										}}
									>
										Crear Sala
									</Button>
								</div>
							)}
						</div>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default JoinRoomModal;
