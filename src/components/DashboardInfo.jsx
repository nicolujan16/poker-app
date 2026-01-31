import React from "react";
import { BookOpen, Scroll, Code, ExternalLink } from "lucide-react";
import Swal from "sweetalert2";
import rankinManosIMG from "../assets/ranking-manos.png";

const DashboardInfo = () => {
	const showHandRanking = () => {
		Swal.fire({
			title: "Jerarquía de Manos",
			imageUrl: rankinManosIMG,
			imageWidth: 400,
			imageAlt: "Ranking de manos de poker",
			background: "#1f2937",
			color: "#fff",
			confirmButtonText: "Entendido",
			confirmButtonColor: "#f59e0b",
			backdrop: `rgba(0,0,0,0.8)`,
		});
	};

	const showRules = () => {
		Swal.fire({
			title: "Reglas Básicas (Texas Hold'em)",
			html: `
        <div style="text-align: left; font-size: 0.9rem; line-height: 1.6;">
          <p>1. Cada jugador recibe <strong>2 cartas</strong> privadas.</p>
          <p>2. Se reparten <strong>5 cartas comunitarias</strong> en tres fases: Flop (3), Turn (1) y River (1).</p>
          <p>3. El objetivo es formar la mejor mano de <strong>5 cartas</strong> combinando las tuyas con las de la mesa.</p>
          <p>4. Hay 4 rondas de apuestas. Puedes: <span style="color:#f59e0b">Apostar, Igualar, Subir o Retirarte</span>.</p>
          <br/>
          <p><em>¡El último jugador en pie o con la mejor mano gana el pozo!</em></p>
        </div>
      `,
			background: "#1f2937",
			color: "#fff",
			confirmButtonText: "¡A jugar!",
			confirmButtonColor: "#f59e0b",
			backdrop: `rgba(0,0,0,0.8)`,
		});
	};

	const openPortfolio = () => {
		window.open("https://nicolujandev.netlify.app/", "_blank");
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full px-4">
			{/* CARD 1: RANKING DE MANOS */}
			<div
				onClick={showHandRanking}
				className="bg-gray-800/40 border border-gray-700/50 p-5 rounded-xl flex items-center gap-4 hover:bg-gray-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 cursor-pointer group"
			>
				<div className="p-3 rounded-full bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-110 transition-transform">
					<BookOpen className="w-6 h-6" />
				</div>
				<div>
					<h3 className="font-bold text-gray-200 group-hover:text-amber-500 transition-colors">
						Ranking de Manos
					</h3>
					<p className="text-xs text-gray-500 mt-1">
						Consulta qué mano gana a cuál
					</p>
				</div>
			</div>

			{/* CARD 2: REGLAS */}
			<div
				onClick={showRules}
				className="bg-gray-800/40 border border-gray-700/50 p-5 rounded-xl flex items-center gap-4 hover:bg-gray-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 cursor-pointer group"
			>
				<div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-transform">
					<Scroll className="w-6 h-6" />
				</div>
				<div>
					<h3 className="font-bold text-gray-200 group-hover:text-amber-500 transition-colors">
						Reglas del Juego
					</h3>
					<p className="text-xs text-gray-500 mt-1">
						Aprende lo básico para ganar
					</p>
				</div>
			</div>

			{/* CARD 3: DEVELOPER (La Joya) */}
			<div
				onClick={openPortfolio}
				className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 p-5 rounded-xl flex items-center gap-4 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20 transition-all duration-300 cursor-pointer group relative overflow-hidden"
			>
				{/* Efecto de brillo sutil en el fondo */}
				<div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>

				<div className="p-3 rounded-full bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-110 transition-transform z-10">
					<Code className="w-6 h-6" />
				</div>
				<div className="z-10 flex-1">
					<h3 className="font-bold text-gray-200 group-hover:text-purple-400 transition-colors flex items-center gap-2">
						Desarrollador
						<ExternalLink className="w-3 h-3 opacity-50" />
					</h3>
					<p className="text-xs text-gray-400 mt-1">
						¿Te gusta este proyecto?{" "}
						<span className="text-purple-300/80">Hablemos.</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default DashboardInfo;
