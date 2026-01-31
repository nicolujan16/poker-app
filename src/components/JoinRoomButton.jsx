import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, X, Coins, DollarSign, LogIn, Play } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";

const JoinRoomButton = ({
	room,
	onJoin,
	onRejoin, // Nueva prop
	isAlreadyInRoom = false, // Nueva prop
	userBalance = 10000,
}) => {
	const [isJoining, setIsJoining] = useState(false);

	// Estados para los Modales
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showBuyInModal, setShowBuyInModal] = useState(false);

	// Datos del formulario
	const [password, setPassword] = useState("");
	const [buyInAmount, setBuyInAmount] = useState(room.buyInMin || 0);
	const [error, setError] = useState("");

	const isFull = room.currentPlayers >= room.maxPlayers;
	const canAfford = userBalance >= (room.buyInMin || 0);

	// Inicializar el buyInAmount
	useEffect(() => {
		if (showBuyInModal) {
			setBuyInAmount(room.buyInMin || 0);
		}
	}, [showBuyInModal, room]);

	const handleInitialClick = () => {
		// 1. SI YA ESTÁ EN LA SALA -> VOLVER DIRECTO
		if (isAlreadyInRoom) {
			if (onRejoin) onRejoin(room.id);
			return;
		}

		if (isFull) return;

		if (!canAfford) {
			alert("No tienes suficientes fichas para entrar a esta sala");
			return;
		}

		if (room.isPrivate) {
			setShowPasswordModal(true);
		} else {
			setShowBuyInModal(true);
		}
	};

	const handlePasswordSubmit = (e) => {
		e.preventDefault();
		if (!password) {
			setError("Ingresa la contraseña");
			return;
		}
		setShowPasswordModal(false);
		setShowBuyInModal(true);
	};

	const handleJoinSubmit = async (e) => {
		e.preventDefault();
		setIsJoining(true);

		try {
			await onJoin({
				roomID: room.id,
				password: password,
				moneyInGame: buyInAmount,
			});
		} catch (err) {
			console.error(err);
			setIsJoining(false);
		}
	};

	const handleSliderChange = (e) => setBuyInAmount(Number(e.target.value));
	const handleInputChange = (e) => {
		let val = Number(e.target.value);
		if (val > room.buyInMax) val = room.buyInMax;
		setBuyInAmount(val);
	};

	// --- LÓGICA DE ESTILOS DEL BOTÓN ---
	let buttonClasses =
		"min-w-[100px] font-semibold transition-all duration-300 ";
	let content;

	if (isAlreadyInRoom) {
		// ESTILO PARA "VOLVER A LA MESA"
		buttonClasses +=
			"bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-gray-900 shadow-lg shadow-emerald-900/20";
		content = (
			<span className="flex items-center gap-1.5">
				<Play className="w-3 h-3 fill-current" /> Volver
			</span>
		);
	} else if (isJoining) {
		buttonClasses +=
			"bg-amber-500/10 text-amber-500 border border-amber-500/50";
		content = <Loader2 className="w-4 h-4 animate-spin" />;
	} else if (isFull) {
		buttonClasses +=
			"bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed";
		content = "Llena";
	} else if (!canAfford) {
		buttonClasses +=
			"bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed";
		content = "Sin Fichas";
	} else if (room.isPrivate) {
		buttonClasses +=
			"bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500 hover:text-gray-900 shadow-lg shadow-amber-900/20";
		content = (
			<span className="flex items-center gap-1.5">
				<Lock className="w-3 h-3" /> Privada
			</span>
		);
	} else {
		buttonClasses +=
			"bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500 hover:text-gray-900 shadow-lg shadow-amber-900/20";
		content = (
			<span className="flex items-center gap-1.5">
				<LogIn className="w-3 h-3" /> Unirse
			</span>
		);
	}

	return (
		<>
			<Button
				onClick={handleInitialClick}
				disabled={(isFull || !canAfford || isJoining) && !isAlreadyInRoom}
				size="sm"
				className={buttonClasses}
			>
				{content}
			</Button>

			{/* --- MODAL DE CONTRASEÑA --- */}
			<AnimatePresence>
				{showPasswordModal && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black/80 backdrop-blur-sm"
							onClick={() => setShowPasswordModal(false)}
						/>

						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 10 }}
							className="relative w-full max-w-sm bg-gray-900 border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden"
						>
							<div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
								<h3 className="text-white font-bold flex items-center gap-2">
									<Lock className="w-4 h-4 text-amber-500" />
									Sala Privada
								</h3>
								<button
									onClick={() => setShowPasswordModal(false)}
									className="text-gray-400 hover:text-white transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							<form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
								<p className="text-sm text-gray-400">
									Ingresa la contraseña para entrar a{" "}
									<span className="text-amber-400">{room.name}</span>
								</p>

								<div className="space-y-2">
									<Input
										type="password"
										placeholder="Contraseña..."
										value={password}
										onChange={(e) => {
											setPassword(e.target.value);
											setError("");
										}}
										className={cn(
											"bg-gray-950 border-gray-700 focus:border-amber-500",
											error && "border-red-500",
										)}
										autoFocus
									/>
									{error && (
										<p className="text-xs text-red-400 font-medium">{error}</p>
									)}
								</div>

								<div className="flex justify-end pt-2">
									<Button
										type="submit"
										className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold"
									>
										Siguiente
									</Button>
								</div>
							</form>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* --- MODAL DE SELECCIÓN DE FICHAS (BUY-IN) --- */}
			<AnimatePresence>
				{showBuyInModal && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black/80 backdrop-blur-sm"
							onClick={() => !isJoining && setShowBuyInModal(false)}
						/>

						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 10 }}
							className="relative w-full max-w-sm bg-gray-900 border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden"
						>
							<div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
								<h3 className="text-white font-bold flex items-center gap-2">
									<Coins className="w-4 h-4 text-amber-500" />
									Comprar Fichas (Buy-In)
								</h3>
								<button
									onClick={() => setShowBuyInModal(false)}
									disabled={isJoining}
									className="text-gray-400 hover:text-white transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							<form onSubmit={handleJoinSubmit} className="p-6 space-y-6">
								<div className="text-center space-y-1">
									<p className="text-sm text-gray-400">
										Elige con cuánto quieres entrar
									</p>
									<div className="flex items-center justify-center text-3xl font-bold text-amber-500">
										<DollarSign className="w-6 h-6 mr-1" />
										{buyInAmount.toLocaleString()}
									</div>
									<p className="text-xs text-gray-500">
										Mín: ${room.buyInMin} - Máx: ${room.buyInMax}
									</p>
								</div>

								<div className="space-y-4">
									<div className="flex items-center gap-4">
										<span className="text-xs text-gray-500 font-mono w-12 text-right">
											${room.buyInMin}
										</span>
										<input
											type="range"
											min={room.buyInMin}
											max={Math.min(room.buyInMax, userBalance)}
											step={10}
											value={buyInAmount}
											onChange={handleSliderChange}
											className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
										/>
										<span className="text-xs text-gray-500 font-mono w-12 text-left">
											${room.buyInMax}
										</span>
									</div>

									<div className="relative">
										<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
											<DollarSign className="w-4 h-4 text-gray-500" />
										</div>
										<Input
											type="number"
											min={room.buyInMin}
											max={room.buyInMax}
											value={buyInAmount}
											onChange={handleInputChange}
											className="bg-gray-950 border-gray-700 pl-9 text-center font-mono text-lg focus:border-amber-500"
										/>
									</div>
								</div>

								{(buyInAmount < room.buyInMin ||
									buyInAmount > room.buyInMax) && (
									<p className="text-xs text-red-400 text-center font-medium">
										El monto debe estar entre {room.buyInMin} y {room.buyInMax}
									</p>
								)}

								<Button
									type="submit"
									disabled={
										isJoining ||
										buyInAmount < room.buyInMin ||
										buyInAmount > room.buyInMax
									}
									className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-bold py-5"
								>
									{isJoining ? (
										<div className="flex items-center gap-2">
											<Loader2 className="w-4 h-4 animate-spin" />
											Entrando...
										</div>
									) : (
										"Confirmar y Jugar"
									)}
								</Button>
							</form>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	);
};

export default JoinRoomButton;
