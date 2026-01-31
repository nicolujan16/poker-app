import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

const ChipsModal = ({ isOpen, onClose }) => {
	const { userDataDB: user, updateChips } = useAuth();
	const [timeLeft, setTimeLeft] = useState(null);

	useEffect(() => {
		if (!isOpen || !user) return;

		const updateTimer = () => {
			// 1. Verificamos si existe la propiedad lastClaim (según tu DB se llama así, no lastClaimTime)
			if (!user.lastClaim) {
				setTimeLeft(null);
				return;
			}

			const now = Date.now();
			const cooldownPeriod = 4 * 60 * 60 * 1000; // 4 horas

			// 2. Normalización de fecha (La lógica híbrida que arreglamos antes)
			let lastClaimMs;

			// Si es Timestamp de Firebase
			if (typeof user.lastClaim.toDate === "function") {
				lastClaimMs = user.lastClaim.toDate().getTime();
			}
			// Si es objeto Date nativo (actualización local optimista)
			else if (user.lastClaim instanceof Date) {
				lastClaimMs = user.lastClaim.getTime();
			}
			// Fallback
			else {
				lastClaimMs = new Date(user.lastClaim).getTime();
			}

			// 3. Cálculo del tiempo
			const timeSinceClaim = now - lastClaimMs;

			if (timeSinceClaim < cooldownPeriod) {
				setTimeLeft(cooldownPeriod - timeSinceClaim);
			} else {
				setTimeLeft(null);
			}
		};

		updateTimer(); // Ejecutar inmediatamente
		const interval = setInterval(updateTimer, 1000); // Actualizar cada segundo

		return () => clearInterval(interval);
	}, [isOpen, user]);

	const formatTime = (ms) => {
		if (!ms) return "00:00:00";
		const hours = Math.floor(ms / (1000 * 60 * 60));
		const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((ms % (1000 * 60)) / 1000);
		// Agregamos padStart para que siempre se vea "01" en lugar de "1"
		return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
	};

	const handleClaimChips = async () => {
		// Doble verificación de seguridad
		if (timeLeft) return;

		Swal.fire({
			title: "Cargando Fichas...",
			text: "Por favor espera",
			allowOutsideClick: false,
			background: "#222",
			color: "#eee",
			didOpen: () => {
				Swal.showLoading();
			},
		});

		const result = await updateChips(500, true);
		if (result.success) {
			Swal.fire({
				icon: "success",
				title: "¡Fichas recibidas!",
				background: "#222",
				color: "#eee",
				confirmButtonColor: "#d97706",
			});
		} else {
			Swal.fire({
				icon: "error",
				title: "Error",
				text:
					result.reason === "CLAIM_NOT_READY"
						? "Aún debes esperar"
						: "Intente nuevamente",
				background: "#222",
				color: "#eee",
				confirmButtonColor: "#d97706",
			});
		}
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="absolute inset-0 bg-black/70 backdrop-blur-sm"
					onClick={onClose}
				/>
				<motion.div
					initial={{ opacity: 0, scale: 0.9, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.9, y: 20 }}
					className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-amber-500/20"
				>
					<button
						onClick={onClose}
						className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
					>
						<X className="w-6 h-6" />
					</button>

					<div className="flex flex-col items-center gap-6">
						<div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
							<Coins className="w-10 h-10 text-gray-900" />
						</div>

						<div className="text-center">
							<h2 className="text-2xl font-bold text-white mb-2">
								Fichas Gratis
							</h2>
							<p className="text-gray-400">Reclama 500 fichas cada 4 horas</p>
						</div>

						{/* AQUI ESTA EL CAMBIO DE UI */}
						{/* Mostramos siempre el botón, pero cambiamos su estado y texto */}

						<div className="w-full space-y-3">
							{timeLeft && (
								<div className="text-center mb-2">
									<p className="text-sm text-gray-400">Disponible en:</p>
									<p className="text-xl font-mono text-amber-400 font-bold tracking-wider">
										{formatTime(timeLeft)}
									</p>
								</div>
							)}

							<Button
								onClick={handleClaimChips}
								disabled={!!timeLeft} // Se deshabilita si timeLeft existe (no es null)
								className={`w-full py-6 text-lg font-bold shadow-lg transition-all duration-300
                    ${
											timeLeft
												? "bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600"
												: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 hover:shadow-amber-500/50"
										}`}
							>
								{timeLeft ? "Recarga en progreso" : "Reclamar Fichas"}
							</Button>
						</div>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default ChipsModal;
