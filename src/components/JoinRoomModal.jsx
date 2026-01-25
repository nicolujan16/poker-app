import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

// Mock Data
const MOCK_ROOMS = [
	{
		id: 1,
		name: "La Cueva del Lobo",
		minBuyIn: 100,
		maxBuyIn: 500,
		currentPlayers: 4,
		maxPlayers: 6,
		status: "Playing",
		isPrivate: false,
	},
	{
		id: 2,
		name: "High Rollers VIP",
		minBuyIn: 1000,
		maxBuyIn: 5000,
		currentPlayers: 5,
		maxPlayers: 9,
		status: "Waiting",
		isPrivate: true,
		password: "vip",
	},
	{
		id: 3,
		name: "Friday Night Poker",
		minBuyIn: 200,
		maxBuyIn: 1000,
		currentPlayers: 6,
		maxPlayers: 6,
		status: "Playing",
		isPrivate: false,
	},
	{
		id: 4,
		name: "Beginners Luck",
		minBuyIn: 50,
		maxBuyIn: 200,
		currentPlayers: 2,
		maxPlayers: 9,
		status: "Waiting",
		isPrivate: false,
	},
	{
		id: 5,
		name: "Shark Tank",
		minBuyIn: 500,
		maxBuyIn: 2500,
		currentPlayers: 8,
		maxPlayers: 9,
		status: "Playing",
		isPrivate: false,
	},
	{
		id: 6,
		name: "Private Club 42",
		minBuyIn: 200,
		maxBuyIn: 800,
		currentPlayers: 3,
		maxPlayers: 6,
		status: "Waiting",
		isPrivate: true,
		password: "club",
	},
	{
		id: 7,
		name: "Royal Flush Den",
		minBuyIn: 100,
		maxBuyIn: 400,
		currentPlayers: 1,
		maxPlayers: 6,
		status: "Waiting",
		isPrivate: false,
	},
	{
		id: 8,
		name: "Midnight Madness",
		minBuyIn: 300,
		maxBuyIn: 1500,
		currentPlayers: 5,
		maxPlayers: 6,
		status: "Playing",
		isPrivate: false,
	},
	{
		id: 9,
		name: "Sunday Grind",
		minBuyIn: 100,
		maxBuyIn: 1000,
		currentPlayers: 9,
		maxPlayers: 9,
		status: "Playing",
		isPrivate: false,
	},
];

const JoinRoomModal = ({ isOpen, onClose }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredRooms, setFilteredRooms] = useState(MOCK_ROOMS);
	const navigate = useNavigate();

	useEffect(() => {
		const results = MOCK_ROOMS.filter((room) =>
			room.name.toLowerCase().includes(searchTerm.toLowerCase()),
		);
		setFilteredRooms(results);
	}, [searchTerm]);

	const handleJoinRoom = (roomId) => {
		onClose();
		navigate(`/room?id=${roomId}`);
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
							{filteredRooms.map((room) => (
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
												Buy-In: ${room.minBuyIn} - ${room.maxBuyIn}
											</span>
											<span className="text-gray-600">|</span>
											<span>
												{room.currentPlayers}/{room.maxPlayers} Jugadores
											</span>
										</div>
									</div>
									<div className="w-full md:w-auto">
										<Button
											onClick={() => handleJoinRoom(room.id)}
											className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold"
										>
											Unirse
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default JoinRoomModal;
