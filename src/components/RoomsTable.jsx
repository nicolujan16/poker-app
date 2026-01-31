import React, { useState } from "react";
import { motion } from "framer-motion";
import {
	Users,
	DollarSign,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Activity,
} from "lucide-react";
import { cn } from "../lib/utils";
import JoinRoomButton from "./JoinRoomButton";

const RoomsTable = ({ rooms }) => {
	const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

	const handleSort = (key) => {
		let direction = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const sortedRooms = [...rooms].sort((a, b) => {
		if (!sortConfig.key) return 0;

		let aValue = a[sortConfig.key];
		let bValue = b[sortConfig.key];

		// Special handling for minBuyIn logic if we want to sort by that when key is 'buyIn'
		if (sortConfig.key === "buyIn") {
			aValue = a.minBuyIn;
			bValue = b.minBuyIn;
		}

		if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
		if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
		return 0;
	});

	const SortIcon = ({ columnKey }) => {
		if (sortConfig.key !== columnKey)
			return <ArrowUpDown className="w-3 h-3 opacity-50" />;
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="w-3 h-3 text-amber-500" />
		) : (
			<ArrowDown className="w-3 h-3 text-amber-500" />
		);
	};

	return (
		<div className="w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 shadow-xl">
			{/* Desktop Header */}
			<div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-900/80 border-b border-gray-800 text-sm font-medium text-gray-400 sticky top-0 z-10 backdrop-blur-sm">
				<div className="col-span-4 pl-2">Nombre de la sala</div>
				<div
					className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none"
					onClick={() => handleSort("buyIn")}
				>
					Buy-In <SortIcon columnKey="buyIn" />
				</div>
				<div
					className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none"
					onClick={() => handleSort("currentPlayers")}
				>
					Jugadores <SortIcon columnKey="currentPlayers" />
				</div>
				<div className="col-span-1 text-center">Estado</div>
				<div className="col-span-2 text-right pr-2">Acción</div>
			</div>

			{/* Table Body */}
			<div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
				{sortedRooms.length === 0 ? (
					<div className="p-12 text-center text-gray-500">
						No se encontraron salas que coincidan con tu búsqueda.
					</div>
				) : (
					<div className="space-y-1 md:space-y-0">
						{sortedRooms.map((room, index) => (
							<motion.div
								key={room.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
								className="group relative md:grid md:grid-cols-12 md:gap-4 p-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors items-center"
							>
								{/* Mobile: Top Row with Name and Status */}
								<div className="flex justify-between items-start md:hidden mb-2">
									<div>
										<h3 className="text-white font-bold text-lg">
											{room.name}
										</h3>
										<div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
											<span className="bg-gray-800 px-2 py-0.5 rounded text-amber-500/80 border border-gray-700">
												${room.minBuyIn} - ${room.maxBuyIn}
											</span>
										</div>
									</div>
									<Badge status={room.status} />
								</div>

								{/* Desktop: Room Name */}
								<div className="hidden md:block col-span-4 pl-2">
									<div className="text-white font-semibold group-hover:text-amber-500 transition-colors truncate">
										{room.name}
									</div>
									<div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
										{room.isPrivate && (
											<span className="text-amber-500/70 flex items-center gap-0.5">
												<Users className="w-3 h-3" /> Privada
											</span>
										)}
									</div>
								</div>

								{/* Desktop: Buy-In */}
								<div className="hidden md:flex col-span-3 items-center gap-1 text-gray-300">
									<span className="text-amber-500/80 font-mono text-sm">
										${room.minBuyIn}
									</span>
									<span className="text-gray-600">-</span>
									<span className="text-amber-500/80 font-mono text-sm">
										${room.maxBuyIn}
									</span>
								</div>

								{/* Desktop/Mobile: Players */}
								<div className="md:col-span-2 flex items-center gap-3 text-gray-300 mb-4 md:mb-0">
									<div className="w-full bg-gray-800 rounded-full h-2 md:w-24 overflow-hidden relative">
										<div
											className={cn(
												"h-full rounded-full transition-all duration-500",
												room.currentPlayers >= room.maxPlayers
													? "bg-red-500"
													: "bg-amber-500",
											)}
											style={{
												width: `${(room.currentPlayers / room.maxPlayers) * 100}%`,
											}}
										/>
									</div>
									<span className="text-xs font-mono whitespace-nowrap">
										{room.currentPlayers}/{room.maxPlayers}
									</span>
								</div>

								{/* Desktop: Status */}
								<div className="hidden md:flex col-span-1 justify-center">
									<Badge status={room.status} />
								</div>

								{/* Action Button */}
								<div className="md:col-span-2 flex justify-end md:pr-2">
									<JoinRoomButton room={room} />
								</div>
							</motion.div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

const Badge = ({ status }) => {
	const styles = {
		Waiting: "bg-green-500/10 text-green-500 border-green-500/20",
		Playing: "bg-amber-500/10 text-amber-500 border-amber-500/20",
		Full: "bg-red-500/10 text-red-500 border-red-500/20",
	};

	const label = status === "Waiting" ? "Esperando" : "Jugando";

	return (
		<span
			className={cn(
				"px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5",
				styles[status] || styles.Waiting,
			)}
		>
			<span
				className={cn(
					"w-1.5 h-1.5 rounded-full animate-pulse",
					status === "Waiting" ? "bg-green-500" : "bg-amber-500",
				)}
			></span>
			{label}
		</span>
	);
};

export default RoomsTable;
