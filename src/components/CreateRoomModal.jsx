/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Unlock, AlertCircle, RefreshCw, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Slider } from "./ui/slider";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // Importamos SweetAlert
// IMPORTANTE: Ajusta la ruta a donde tengas tu función createRoom
import { createRoom } from "../logic/logic";

const CreateRoomModal = ({ isOpen, onClose, currentUser }) => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

	// Form State
	const [roomName, setRoomName] = useState("");
	const [maxPlayers, setMaxPlayers] = useState([6]);
	const [smallBlind, setSmallBlind] = useState(50);
	const [minBuyIn, setMinBuyIn] = useState(500);
	const [maxBuyIn, setMaxBuyIn] = useState(5000);
	const [isPrivate, setIsPrivate] = useState(false);
	const [password, setPassword] = useState("");
	const [initialChips, setInitialChips] = useState([200]);

	// Validation State
	const [errors, setErrors] = useState({});

	// Derived Values
	const bigBlind = smallBlind * 2;
	const minRequiredBuyIn = bigBlind * 4;

	// Effects for auto-calculations (Mantenemos tu logica de UI intacta)
	useEffect(() => {
		if (minBuyIn < minRequiredBuyIn) {
			setMinBuyIn(minRequiredBuyIn);
		}
	}, [bigBlind]);

	useEffect(() => {
		const suggestedMax = minBuyIn * 2;
		if (maxBuyIn < minBuyIn) {
			setMaxBuyIn(suggestedMax);
		}
		if (initialChips[0] < minBuyIn) setInitialChips([minBuyIn]);
		if (initialChips[0] > maxBuyIn) setInitialChips([maxBuyIn]);
	}, [minBuyIn]);

	useEffect(() => {
		if (maxBuyIn < minBuyIn) {
			setMaxBuyIn(minBuyIn);
		}
		if (initialChips[0] > maxBuyIn) setInitialChips([maxBuyIn]);
	}, [maxBuyIn]);

	// Handlers
	const handleRoomNameChange = (e) => {
		const value = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "");
		if (value.length <= 20) {
			setRoomName(value);
			if (value.length >= 3) {
				setErrors((prev) => ({ ...prev, roomName: null }));
			}
		}
	};

	const handleSmallBlindChange = (e) => {
		const value = parseInt(e.target.value) || 0;
		setSmallBlind(Math.max(0, Math.min(200000, value)));
	};

	const handleMinBuyInChange = (e) => {
		const value = parseInt(e.target.value) || 0;
		setMinBuyIn(Math.max(0, Math.min(999999, value)));
	};

	const handleMaxBuyInChange = (e) => {
		const value = parseInt(e.target.value) || 0;
		setMaxBuyIn(Math.max(0, Math.min(999999, value)));
	};

	// Validation Logic
	const validateForm = () => {
		const newErrors = {};

		if (!roomName || roomName.length < 3) {
			newErrors.roomName = "El nombre debe tener entre 3 y 20 caracteres.";
		}

		if (minBuyIn < minRequiredBuyIn) {
			newErrors.buyIn = `El Buy-In mínimo debe ser al menos ${minRequiredBuyIn} (4 BB).`;
		}

		if (maxBuyIn < minBuyIn) {
			newErrors.maxBuyIn = "El Buy-In máximo no puede ser menor al mínimo.";
		}

		if (initialChips[0] < minBuyIn || initialChips[0] > maxBuyIn) {
			newErrors.chips =
				"Tus fichas iniciales deben estar dentro del rango de Buy-In.";
		}

		if (isPrivate && (!password || password.length < 4)) {
			newErrors.password = "La contraseña debe tener al menos 4 caracteres.";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// ---------------------------------------------------------
	// AQUÍ ESTÁ LA INTEGRACIÓN CON TU LÓGICA ANTIGUA
	// ---------------------------------------------------------
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsLoading(true);

		// 1. ADAPTADOR DE DATOS:
		// Transformamos los datos del nuevo form al formato que espera tu función createRoom
		const formToCreate = {
			nombreSala: roomName, // UI: roomName -> Logic: nombreSala
			roomState: "waiting", // Logic necesita esto, la UI no lo tenía
			maxPlayers: maxPlayers[0], // Slider devuelve array, Logic necesita int
			buyInMin: minBuyIn,
			buyInMax: maxBuyIn,
			smallBlind: smallBlind,
			bigBlind: bigBlind,
			isPrivate: isPrivate,
			password: isPrivate ? password : null, // Si es publica, null
			// Datos extra que quizás te sirvan en el futuro
			creatorInitialChips: initialChips[0],
		};

		try {
			// 2. LLAMADA A TU LÓGICA (Lambda + Firebase)
			const response = await createRoom({
				formToCreate,
				user: currentUser,
			});

			// 3. VERIFICACIÓN DE ÉXITO
			if (response.status === 200) {
				Swal.fire({
					icon: "success",
					title: "¡Sala Creada!",
					text: `Entrando a ${roomName}...`,
					timer: 1500,
					showConfirmButton: false,
					background: "#1f2937", // Gris oscuro estilo tailwind
					color: "#fff",
				});

				// 4. REDIRECCIÓN
				// Asumiendo que tu ruta es /game/nombreSala o /room/nombreSala
				// Ajusta esto según tus rutas reales
				setTimeout(() => {
					onClose();
					navigate(`/room?id=${roomName}`);
				}, 1500);
			} else {
				throw new Error(response.message || "Error desconocido");
			}
		} catch (error) {
			console.error("Error creando sala:", error);
			Swal.fire({
				icon: "error",
				title: "Error",
				text:
					error.message || "No se pudo crear la sala. Intenta con otro nombre.",
				background: "#1f2937",
				color: "#fff",
				confirmButtonColor: "#d97706",
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
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
					className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
				>
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
						<div>
							<h2 className="text-2xl font-bold text-white flex items-center gap-2">
								<span className="text-amber-500">Crear Sala</span> de Póker
							</h2>
							<p className="text-gray-400 text-sm mt-1">
								Configura las reglas de tu mesa
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-full transition-colors"
						>
							<X className="w-6 h-6" />
						</button>
					</div>

					<div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
						<form
							id="create-room-form"
							onSubmit={handleSubmit}
							className="space-y-8"
						>
							{/* INPUT DE NOMBRE DE SALA */}
							<div className="space-y-2">
								<div className="flex justify-between">
									<Label htmlFor="roomName" className="text-gray-200">
										Alias de sala
									</Label>
									<span
										className={cn(
											"text-xs",
											roomName.length >= 3 ? "text-green-500" : "text-gray-500",
										)}
									>
										{roomName.length}/20
									</span>
								</div>
								<Input
									id="roomName"
									value={roomName}
									onChange={handleRoomNameChange}
									// Usamos optional chaining por si currentUser tarda en cargar
									placeholder={`${currentUser?.username || "jugador"}room`}
									className={cn(
										"bg-gray-800 border-gray-700 focus:border-amber-500",
										errors.roomName && "border-red-500",
									)}
								/>
								{errors.roomName ? (
									<p className="text-red-400 text-xs flex items-center gap-1">
										<AlertCircle className="w-3 h-3" /> {errors.roomName}
									</p>
								) : (
									<p className="text-gray-500 text-xs">
										Solo letras, números, guiones y guiones bajos.
									</p>
								)}
							</div>

							{/* SLIDER JUGADORES */}
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<Label className="text-gray-200">Límite de jugadores</Label>
									<span className="text-amber-500 font-bold text-lg bg-gray-800 px-3 py-1 rounded-md border border-gray-700">
										{maxPlayers[0]}
									</span>
								</div>
								<Slider
									value={maxPlayers}
									onValueChange={setMaxPlayers}
									min={2}
									max={9}
									step={1}
									className="py-4"
								/>
								<div className="flex justify-between text-xs text-gray-500 px-1">
									<span>Heads-up (2)</span>
									<span>Full Ring (9)</span>
								</div>
							</div>

							{/* GRID CIEGAS Y BUYINS */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
									<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
										<Info className="w-4 h-4" /> Ciegas
									</h3>

									<div className="space-y-2">
										<Label
											htmlFor="smallBlind"
											className="text-gray-300 text-xs"
										>
											Ciega pequeña (SB)
										</Label>
										<div className="relative">
											<span className="absolute left-3 top-2.5 text-gray-500">
												$
											</span>
											<Input
												id="smallBlind"
												type="number"
												value={smallBlind}
												onChange={handleSmallBlindChange}
												className="pl-6 bg-gray-800 border-gray-600"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label className="text-gray-300 text-xs">
											Ciega grande (BB)
										</Label>
										<div className="relative">
											<span className="absolute left-3 top-2.5 text-gray-500">
												$
											</span>
											<Input
												disabled
												value={bigBlind}
												className="pl-6 bg-gray-900/50 border-gray-700 text-gray-400 cursor-not-allowed"
											/>
										</div>
									</div>
								</div>

								<div className="space-y-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
									<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
										<RefreshCw className="w-4 h-4" /> Buy-In
									</h3>

									<div className="space-y-2">
										<Label htmlFor="minBuyIn" className="text-gray-300 text-xs">
											Mínimo (Min: {minRequiredBuyIn})
										</Label>
										<div className="relative">
											<span className="absolute left-3 top-2.5 text-amber-500/50">
												$
											</span>
											<Input
												id="minBuyIn"
												type="number"
												value={minBuyIn}
												onChange={handleMinBuyInChange}
												className={cn(
													"pl-6 bg-gray-800 border-gray-600",
													errors.buyIn && "border-red-500",
												)}
											/>
										</div>
										{errors.buyIn && (
											<p className="text-red-400 text-xs">{errors.buyIn}</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="maxBuyIn" className="text-gray-300 text-xs">
											Máximo
										</Label>
										<div className="relative">
											<span className="absolute left-3 top-2.5 text-amber-500/50">
												$
											</span>
											<Input
												id="maxBuyIn"
												type="number"
												value={maxBuyIn}
												onChange={handleMaxBuyInChange}
												className={cn(
													"pl-6 bg-gray-800 border-gray-600",
													errors.maxBuyIn && "border-red-500",
												)}
											/>
										</div>
										{errors.maxBuyIn && (
											<p className="text-red-400 text-xs">{errors.maxBuyIn}</p>
										)}
									</div>
								</div>
							</div>

							{/* FICHAS INICIALES DEL CREADOR */}
							<div className="space-y-4">
								<div className="flex justify-between items-end">
									<Label className="text-gray-200">
										Fichas iniciales para ti
									</Label>
									<div className="text-right">
										<span className="text-2xl font-bold text-amber-500 block">
											{initialChips[0].toLocaleString()}
										</span>
										<span className="text-xs text-gray-400">
											{(initialChips[0] / bigBlind).toFixed(1)} BB
										</span>
									</div>
								</div>
								<Slider
									value={initialChips}
									onValueChange={setInitialChips}
									min={minBuyIn}
									max={maxBuyIn}
									step={smallBlind}
									className="py-4"
								/>
								<div className="flex justify-between text-xs text-gray-500">
									<span>Min: {minBuyIn}</span>
									<span>Max: {maxBuyIn}</span>
								</div>
								{errors.chips && (
									<p className="text-red-400 text-xs text-center">
										{errors.chips}
									</p>
								)}
							</div>

							{/* OPCION PRIVADA */}
							<div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
								<div className="flex items-center space-x-3 mb-4">
									<Checkbox
										id="isPrivate"
										checked={isPrivate}
										onCheckedChange={setIsPrivate}
									/>
									<Label
										htmlFor="isPrivate"
										className="text-white cursor-pointer select-none flex items-center gap-2"
									>
										{isPrivate ? (
											<Lock className="w-4 h-4 text-amber-500" />
										) : (
											<Unlock className="w-4 h-4 text-gray-400" />
										)}
										Sala Privada
									</Label>
								</div>

								<AnimatePresence>
									{isPrivate && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											className="overflow-hidden"
										>
											<div className="pt-2">
												<Label
													htmlFor="roomPassword"
													className="text-gray-300 text-xs mb-1.5 block"
												>
													Contraseña de acceso
												</Label>
												<Input
													id="roomPassword"
													type="password"
													value={password}
													onChange={(e) => setPassword(e.target.value)}
													placeholder="Ingresa una contraseña segura"
													className={cn(
														"bg-gray-900 border-gray-600",
														errors.password && "border-red-500",
													)}
												/>
												{errors.password && (
													<p className="text-red-400 text-xs mt-1">
														{errors.password}
													</p>
												)}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</form>
					</div>

					{/* FOOTER BOTONES */}
					<div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3 z-10">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
							className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							form="create-room-form"
							disabled={isLoading}
							className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-bold px-8 shadow-lg shadow-amber-500/20"
						>
							{isLoading ? (
								<div className="flex items-center gap-2">
									<RefreshCw className="w-4 h-4 animate-spin" />
									Creando...
								</div>
							) : (
								"Crear Sala"
							)}
						</Button>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default CreateRoomModal;
