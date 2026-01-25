import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, ArrowRight, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../components/ui/use-toast";
import { cn } from "../lib/utils";

const JoinRoomButton = ({ room, onJoin }) => {
	const [isJoining, setIsJoining] = useState(false);
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const { toast } = useToast();

	const isFull = room.currentPlayers >= room.maxPlayers;

	const handleInitialClick = () => {
		if (isFull) return;

		if (room.isPrivate) {
			setShowPasswordModal(true);
		} else {
			performJoin();
		}
	};

	const performJoin = async (passwordAttempt = null) => {
		setIsJoining(true);
		setError("");

		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (room.isPrivate && passwordAttempt !== room.password) {
			setError("Contraseña incorrecta");
			setIsJoining(false);
			toast({
				title: "Error de acceso",
				description: "La contraseña ingresada no es correcta.",
				variant: "destructive",
			});
			return;
		}

		setIsJoining(false);
		setShowPasswordModal(false);

		toast({
			title: "¡Te has unido!",
			description: `Bienvenido a la sala ${room.name}`,
			className: "bg-green-900 border-green-800 text-white",
		});

		if (onJoin) onJoin(room);
	};

	const handlePasswordSubmit = (e) => {
		e.preventDefault();
		if (!password) {
			setError("Ingresa la contraseña");
			return;
		}
		performJoin(password);
	};

	return (
		<>
			<Button
				onClick={handleInitialClick}
				disabled={isFull || isJoining}
				size="sm"
				className={cn(
					"min-w-[100px] font-semibold transition-all duration-300",
					isFull
						? "bg-gray-700 text-gray-500 border-gray-600"
						: "bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500 hover:text-gray-900 shadow-lg shadow-amber-900/20",
				)}
			>
				{isJoining ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : isFull ? (
					"Llena"
				) : room.isPrivate ? (
					<span className="flex items-center gap-1.5">
						<Lock className="w-3 h-3" /> Privada
					</span>
				) : (
					"Unirse"
				)}
			</Button>

			{/* Password Modal Portal */}
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
										disabled={isJoining}
										className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold"
									>
										{isJoining ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											"Confirmar"
										)}
									</Button>
								</div>
							</form>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	);
};

export default JoinRoomButton;
