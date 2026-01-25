import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Swal from "sweetalert2";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Spade, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
	const [loginData, setLoginData] = useState({
		email: "",
		password: "",
		rememberMe: false,
	});
	const [signupData, setSignupData] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const { verifyUsername, currentUser, login, signup } = useAuth();

	const navigate = useNavigate();
	useEffect(() => {
		if (currentUser === null) return;

		navigate("/Home");
	}, [currentUser, navigate]);

	const handleLogin = async (e) => {
		e.preventDefault();
		// Pantalla de carga
		Swal.fire({
			title: "Iniciando Sesión...",
			text: "Por favor espera",
			allowOutsideClick: false,
			background: "#222",
			color: "#eee",
			didOpen: () => {
				Swal.showLoading();
			},
		});

		try {
			await login(loginData);
			Swal.close();
		} catch (err) {
			Swal.fire({
				icon: "error",
				title: err.message,
			});
		}
	};

	const handleSignup = async (e) => {
		e.preventDefault();
		// Verificamos datos
		// Verificamos contraseñas
		if (signupData.password !== signupData.confirmPassword) {
			Swal.fire({
				icon: "error",
				title: "Contraseñas no coinciden",
			});
			return;
		}

		// Verificamos que no sea debil
		if (signupData.password.length < 6) {
			Swal.fire({
				icon: "warning",
				title: "Contraseña debil",
				text: "La contraseña debe tener al menos 6 caracteres",
			});
			return;
		}

		Swal.fire({
			title: "Verificando Datos",
			text: "Por favor espera",
			allowOutsideClick: false,
			background: "#222",
			color: "#eee",
			didOpen: () => {
				Swal.showLoading();
			},
		});

		let isUsernameAllowed = await verifyUsername(signupData.username);

		console.log(isUsernameAllowed);
		// Verificamos que el usuario este disponible
		if (!isUsernameAllowed) {
			Swal.fire({
				icon: "error",
				title: "Nombre de usuario en uso",
				background: "#222",
				color: "#eee",
			});
			return;
		}

		// Si todo esta ok, registramos
		Swal.close();
		Swal.fire({
			title: "Registrando Usuario...",
			text: "Por favor espera",
			allowOutsideClick: false,
			background: "#222",
			color: "#eee",
			didOpen: () => {
				Swal.showLoading();
			},
		});
		try {
			await signup(signupData);
			window.location.reload();
		} catch (err) {
			Swal.fire({
				icon: "error",
				title: err,
			});
		}
	};

	return (
		<>
			<Helmet>
				<title>Pokernauta - Iniciar Sesión</title>
				<meta
					name="description"
					content="Inicia sesión en Pokernauta, la mejor plataforma de poker online"
				/>
			</Helmet>

			<div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
				{/* Background Image */}
				<div
					className="absolute inset-0 z-0"
					style={{
						backgroundImage:
							"url(https://images.unsplash.com/photo-1643200350893-0f386c79e0be)",
						backgroundSize: "cover",
						backgroundPosition: "center",
						filter: "brightness(0.3)",
					}}
				/>

				{/* Gradient Overlay */}
				<div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-black/80 to-gray-900/90 z-0" />

				{/* Floating Decorative Elements */}
				<motion.div
					animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
					transition={{ duration: 6, repeat: Infinity }}
					className="absolute top-20 left-10 text-amber-500/20"
				>
					<Spade className="w-24 h-24" />
				</motion.div>
				<motion.div
					animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
					transition={{ duration: 8, repeat: Infinity }}
					className="absolute bottom-20 right-10 text-red-500/20"
				>
					<Heart className="w-24 h-24" />
				</motion.div>

				{/* Login Form Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="relative z-10 w-full max-w-md"
				>
					<div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
						{/* Header */}
						<div className="bg-gradient-to-r from-amber-500 to-amber-600 py-8 px-6 text-center">
							<motion.h1
								initial={{ scale: 0.9 }}
								animate={{ scale: 1 }}
								className="text-4xl font-bold text-gray-900 tracking-wider"
							>
								POKERNAUTA
							</motion.h1>
							<p className="text-gray-800 mt-2">La mesa te espera</p>
						</div>

						{/* Tabs */}
						<div className="p-6">
							<Tabs defaultValue="login" className="w-full">
								<TabsList className="grid w-full grid-cols-2 bg-gray-800 p-1 rounded-lg mb-6">
									<TabsTrigger
										value="login"
										className="data-[state=active]:bg-amber-500 data-[state=active]:text-gray-900 text-gray-300 transition-all cursor-pointer"
									>
										Iniciar sesión
									</TabsTrigger>
									<TabsTrigger
										value="signup"
										className="data-[state=active]:bg-amber-500 data-[state=active]:text-gray-900 text-gray-300 transition-all cursor-pointer"
									>
										Registrarse
									</TabsTrigger>
								</TabsList>

								{/* Login Tab */}
								<TabsContent value="login">
									<form onSubmit={handleLogin} className="space-y-4">
										<div>
											<Label htmlFor="login-email" className="text-gray-300">
												Email o Usuario
											</Label>
											<Input
												id="login-email"
												type="text"
												placeholder="usuario@ejemplo.com"
												value={loginData.email}
												onChange={(e) =>
													setLoginData({ ...loginData, email: e.target.value })
												}
												className="mt-1"
											/>
										</div>

										<div>
											<Label htmlFor="login-password" className="text-gray-300">
												Contraseña
											</Label>
											<Input
												id="login-password"
												type="password"
												placeholder="••••••••"
												value={loginData.password}
												onChange={(e) =>
													setLoginData({
														...loginData,
														password: e.target.value,
													})
												}
												className="mt-1"
											/>
										</div>

										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Checkbox
													id="remember"
													checked={loginData.rememberMe}
													onCheckedChange={(checked) =>
														setLoginData({ ...loginData, rememberMe: checked })
													}
												/>
												<Label
													htmlFor="remember"
													className="text-sm text-gray-400 cursor-pointer"
												>
													Recordarme
												</Label>
											</div>
											<button
												type="button"
												className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
											>
												¿Olvidaste tu contraseña?
											</button>
										</div>

										<Button
											type="submit"
											className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-bold py-6 text-lg shadow-lg hover:shadow-amber-500/50 transition-all duration-300"
										>
											Iniciar sesión
										</Button>
									</form>
								</TabsContent>

								{/* Signup Tab */}
								<TabsContent value="signup">
									<form onSubmit={handleSignup} className="space-y-4">
										<div>
											<Label
												htmlFor="signup-username"
												className="text-gray-300"
											>
												Nombre de Usuario
											</Label>
											<Input
												id="signup-username"
												type="text"
												placeholder="jugador123"
												value={signupData.username}
												onChange={(e) =>
													setSignupData({
														...signupData,
														username: e.target.value,
													})
												}
												className="mt-1"
											/>
										</div>

										<div>
											<Label htmlFor="signup-email" className="text-gray-300">
												Email
											</Label>
											<Input
												id="signup-email"
												type="email"
												placeholder="usuario@ejemplo.com"
												value={signupData.email}
												onChange={(e) =>
													setSignupData({
														...signupData,
														email: e.target.value,
													})
												}
												className="mt-1"
											/>
										</div>

										<div>
											<Label
												htmlFor="signup-password"
												className="text-gray-300"
											>
												Contraseña
											</Label>
											<Input
												id="signup-password"
												type="password"
												placeholder="••••••••"
												value={signupData.password}
												onChange={(e) =>
													setSignupData({
														...signupData,
														password: e.target.value,
													})
												}
												className="mt-1"
											/>
										</div>

										<div>
											<Label htmlFor="signup-confirm" className="text-gray-300">
												Confirmar Contraseña
											</Label>
											<Input
												id="signup-confirm"
												type="password"
												placeholder="••••••••"
												value={signupData.confirmPassword}
												onChange={(e) =>
													setSignupData({
														...signupData,
														confirmPassword: e.target.value,
													})
												}
												className="mt-1"
											/>
										</div>

										<Button
											type="submit"
											className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-bold py-6 text-lg shadow-lg hover:shadow-amber-500/50 transition-all duration-300"
										>
											Registrarse
										</Button>
									</form>
								</TabsContent>
							</Tabs>
						</div>
					</div>
				</motion.div>
			</div>
		</>
	);
}
