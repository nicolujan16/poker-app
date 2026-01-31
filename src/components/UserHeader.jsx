import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { LogOut, Coins } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

const UserHeader = ({ onChipsClick }) => {
	const { userDataDB: user, logout } = useAuth();

	const handleLogout = (e) => {
		e.preventDefault();

		if (user.isGuest) {
			Swal.fire({
				icon: "question",
				title: "¿Cerrar Sesión?",
				text: "Todos los datos de esta cuenta se eliminaran, para que eso no pase, cree una cuenta desde el Lobby",
				showConfirmButton: true,
				confirmButtonText: "Confirmar",
				showCancelButton: true,
				cancelButtonText: "Cancelar",
				background: "#1e2939",
				color: "#eee",
			});
		}
		Swal.fire({
			icon: "question",
			title: "¿Cerrar Sesión?",
			showConfirmButton: true,
			confirmButtonText: "Confirmar",
			showCancelButton: true,
			cancelButtonText: "Cancelar",
			background: "#1e2939",
			color: "#eee",
		}).then((res) => {
			if (res.isConfirmed) logout();
			return;
		});
	};

	return (
		<motion.header
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-xl"
		>
			<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<motion.img
						whileHover={{ scale: 1.05 }}
						src={user.profilePicture || ""}
						alt={user.username || ""}
						className="w-12 h-12 rounded-full border-2 border-amber-500 shadow-lg"
					/>
					<div>
						<h3 className="text-white font-bold text-lg">
							{user.username || ""}
						</h3>
						<p className="text-gray-400 text-sm">{user.email || ""}</p>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={onChipsClick}
						className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-amber-500/50 transition-all duration-300"
					>
						<Coins className="w-5 h-5" />
						<span className="text-lg">{user.fichas}</span>
					</motion.button>

					<Button
						onClick={handleLogout}
						variant="outline"
						className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
					>
						<LogOut className="w-4 h-4 mr-2" />
						Salir
					</Button>
				</div>
			</div>
		</motion.header>
	);
};

export default UserHeader;
