import React from "react";
import { motion } from "framer-motion";

const LobbyButton = ({
	children,
	icon: Icon,
	onClick,
	variant = "primary",
}) => {
	const baseStyles =
		"relative overflow-hidden rounded-2xl p-8 flex flex-col items-center justify-center gap-4 shadow-2xl transition-all duration-300 cursor-pointer group";

	const variants = {
		primary:
			"bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800",
		secondary:
			"bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800",
	};

	return (
		<motion.div
			whileHover={{ scale: 1.05, y: -5 }}
			whileTap={{ scale: 0.98 }}
			onClick={onClick}
			className={`${baseStyles} ${variants[variant]}`}
		>
			<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

			{Icon && (
				<motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
					<Icon className="w-16 h-16 text-white" />
				</motion.div>
			)}

			<span className="text-2xl font-bold text-white relative z-10">
				{children}
			</span>

			<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
			</div>
		</motion.div>
	);
};

export default LobbyButton;
