import { useEffect, useRef, useState } from "react";
import { userAction } from "../../../logic/engine";
import { X, DollarSign } from "lucide-react";

export default function RoomControls({ infoSala, user, gameData }) {
	const [betBar, setBetBar] = useState(infoSala.smallBlind);
	const [ourBet, setOurBet] = useState(0);
	const [isTurn, setIsTurn] = useState(false);
	const [fichasRestantes, setFichasRestantes] = useState(0);

	let hasBet = gameData?.hasBet || false;

	const betBarRef = useRef();

	// --- (Tus useEffects de scroll y lógica se mantienen IGUALES) ---
	useEffect(() => {
		const handleScroll = (e) => {
			e.preventDefault();
			if (!isTurn) return;
			const delta = Math.sign(e.deltaY);
			setBetBar((prev) => {
				let newValue = delta > 0 ? prev - 5 : prev + 5;
				newValue = Math.max(
					infoSala.smallBlind,
					Math.min(fichasRestantes, newValue),
				);
				return newValue;
			});
		};
		const betbar = betBarRef.current;
		if (betbar)
			betbar.addEventListener("wheel", handleScroll, { passive: false });
		return () => {
			if (betbar) betbar.removeEventListener("wheel", handleScroll);
		};
	}, [isTurn, infoSala.smallBlind, fichasRestantes]);

	useEffect(() => {
		let playerTurn = gameData?.infoUsers?.filter((p) => p.isTurn);
		if (playerTurn?.length > 0) {
			setIsTurn(playerTurn[0].username === user?.username);
		}
	}, [gameData?.infoUsers, user]);

	useEffect(() => {
		let player = gameData?.infoUsers?.filter(
			(u) => u.username === user.username,
		);
		if (player && player.length > 0) setFichasRestantes(player[0].fichasInGame);
	}, [gameData, user]);

	useEffect(() => {
		let userIndex = gameData?.infoUsers?.findIndex(
			(u) => u.username === user.username,
		);
		if (userIndex != undefined && userIndex != -1) {
			setOurBet(gameData?.infoUsers[userIndex]?.bet || 0);
		}
	}, [gameData, user]);
	// ---------------------------------------------------------------

	const handleBetChange = (e) => {
		let valor;
		if (e.target.value !== undefined) {
			valor = Number(e.target.value);
		} else if (e.target.innerText === "All-In") {
			valor = fichasRestantes;
		}
		setBetBar(valor);
	};

	const setAllIn = () => setBetBar(fichasRestantes);

	const handleAction = (actionType, amount = null) => {
		if (actionType === "Fold") {
			userAction({ roomID: infoSala.nombreSala, action: "Fold" }).then(
				console.log,
			);
			return;
		}
		userAction({
			roomID: infoSala.nombreSala,
			action: actionType,
			amount: amount,
		}).then(console.log);
	};

	const handleBetBarInputChange = (e) => {
		if (e.target.value.length > 7) return;
		setBetBar(Number(e.target.value));
	};

	const renderMainButtons = () => {
		if (hasBet && gameData.currentBet != ourBet) {
			const callAmount =
				user.fichasInGame < gameData.currentBet
					? gameData.infoUsers.find((u) => u.username === user.username)
							?.fichasInGame
					: Number(gameData.currentBet) - ourBet;

			return (
				<>
					<button
						disabled={!isTurn}
						onClick={() => handleAction("Call", callAmount)}
						className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm h-10 px-4 rounded-lg shadow-md shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
					>
						Call ${callAmount}
					</button>
					<button
						disabled={!isTurn || gameData.currentBet >= betBar}
						onClick={() => handleAction("Raise", betBar)}
						className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold text-sm h-10 px-4 rounded-lg shadow-md shadow-amber-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
					>
						Raise ${betBar}
					</button>
				</>
			);
		} else {
			return (
				<>
					<button
						disabled={!isTurn}
						onClick={() => handleAction("Check")}
						className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm h-10 px-4 rounded-lg shadow-md shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
					>
						Check
					</button>
					<button
						disabled={!isTurn}
						onClick={() => handleAction("Bet", betBar)}
						className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold text-sm h-10 px-4 rounded-lg shadow-md shadow-amber-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
					>
						Bet ${betBar}
					</button>
				</>
			);
		}
	};

	return (
		<div className="fixed bottom-0 left-0 z-50 bg-gradient-to-t from-black via-black/80 to-transparent py-4 px-4">
			{/* CAMBIO 2: max-w-lg (más angosto) */}
			<div className="max-w-lg mx-auto flex flex-col gap-2">
				{/* BARRA DE APUESTAS COMPACTA */}
				{isTurn && (
					<div className="bg-gray-900/90 backdrop-blur border border-gray-700 p-2 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-xl">
						<button
							onClick={setAllIn}
							className="text-[10px] font-bold text-red-400 border border-red-900/50 bg-red-900/20 px-2 py-1 rounded hover:bg-red-900/40 transition-colors"
						>
							ALL-IN
						</button>

						<input
							type="range"
							min={infoSala.smallBlind}
							max={fichasRestantes}
							step={infoSala.smallBlind}
							value={betBar}
							onChange={handleBetChange}
							ref={betBarRef}
							className="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
						/>

						<div className="relative">
							<DollarSign className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500" />
							<input
								type="number"
								value={betBar}
								onChange={handleBetBarInputChange}
								className="w-20 bg-black border border-gray-600 text-white text-sm rounded px-1 py-0.5 pl-5 font-mono text-right focus:border-amber-500 outline-none"
							/>
						</div>
					</div>
				)}

				{/* BOTONES DE ACCIÓN COMPACTOS */}
				{/* CAMBIO 3: h-10 (más bajos) */}
				<div className="flex gap-2 h-10">
					<button
						disabled={!isTurn}
						onClick={() => handleAction("Fold")}
						className="w-20 bg-red-900/90 hover:bg-red-700 text-white font-bold text-sm rounded-lg border border-red-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 flex items-center justify-center gap-1"
					>
						<X className="w-4 h-4" /> Fold
					</button>

					{renderMainButtons()}
				</div>
			</div>
		</div>
	);
}
