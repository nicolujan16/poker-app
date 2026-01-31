import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Spade, Heart, Club, Diamond } from "lucide-react";

const POKER_TIPS = [
	"No juegues todas las manos, la paciencia es clave.",
	"Observa a tus oponentes incluso cuando no estés en la mano.",
	"La posición es tan importante como tus cartas.",
	"Nunca hagas bluff solo por hacerlo.",
	"Gestiona tu bankroll con inteligencia.",
	"Si no descubres al 'primo' en la mesa, el primo eres tú.",
];

const SUITS = [
	{ icon: Spade, color: "text-gray-200", name: "Picas" },
	{ icon: Heart, color: "text-red-500", name: "Corazones" },
	{ icon: Club, color: "text-gray-200", name: "Tréboles" },
	{ icon: Diamond, color: "text-red-500", name: "Diamantes" },
];

const LoadingScreen = ({ message = "Preparando la mesa..." }) => {
	const [currentSuit, setCurrentSuit] = useState(0);
	const [tipIndex, setTipIndex] = useState(0);

	useEffect(() => {
		const suitInterval = setInterval(() => {
			setCurrentSuit((prev) => (prev + 1) % SUITS.length);
		}, 800);

		return () => clearInterval(suitInterval);
	}, []);

	// Ciclo de tips (lento)
	useEffect(() => {
		// Seleccionar tip aleatorio inicial
		setTipIndex(Math.floor(Math.random() * POKER_TIPS.length));

		const tipInterval = setInterval(() => {
			setTipIndex((prev) => (prev + 1) % POKER_TIPS.length);
		}, 4000); // Cambia cada 4s

		return () => clearInterval(tipInterval);
	}, []);

	const CurrentIcon = SUITS[currentSuit].icon;

	return (
		<div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-black text-white overflow-hidden">
			{/* Fondo decorativo sutil (patrón de cartas flotando) */}
			<div className="absolute inset-0 opacity-5 pointer-events-none">
				<div className="absolute top-10 left-10 transform -rotate-12">
					<Spade size={120} />
				</div>
				<div className="absolute bottom-20 right-10 transform rotate-12">
					<Heart size={120} />
				</div>
				<div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 rotate-45">
					<Club size={80} />
				</div>
			</div>

			{/* Contenedor Principal */}
			<div className="relative z-10 flex flex-col items-center">
				{/* Animación Central: Ficha girando con el palo */}
				<div className="relative mb-8">
					{/* Anillo de carga giratorio */}
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
						className="w-24 h-24 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-gray-800 border-l-transparent"
					/>

					{/* Círculo central estático simulando ficha */}
					<div className="absolute inset-0 m-2 bg-gray-900 rounded-full border border-gray-700 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
						<AnimatePresence mode="wait">
							<motion.div
								key={currentSuit}
								initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
								animate={{ opacity: 1, scale: 1, rotateY: 0 }}
								exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
								transition={{ duration: 0.3 }}
							>
								<CurrentIcon
									className={`w-10 h-10 ${SUITS[currentSuit].color}`}
									fill="currentColor"
								/>
							</motion.div>
						</AnimatePresence>
					</div>
				</div>

				{/* Texto de carga principal */}
				<h2 className="text-2xl font-bold tracking-wider text-amber-500 mb-2 animate-pulse">
					{message}
				</h2>

				{/* Tips Aleatorios */}
				<div className="h-12 flex items-center justify-center max-w-md px-6 text-center">
					<AnimatePresence mode="wait">
						<motion.p
							key={tipIndex}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="text-sm text-gray-400 italic"
						>
							"{POKER_TIPS[tipIndex]}"
						</motion.p>
					</AnimatePresence>
				</div>
			</div>

			{/* Footer Branding */}
			<div className="absolute bottom-6 text-xs text-gray-600 font-mono">
				POKERNAUTA ENGINE
			</div>
		</div>
	);
};

export default LoadingScreen;
