import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Sala from "./components/Rooms/Sala.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

function App() {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/" element={<LoginPage />} />
					<Route path="/Home" element={<HomePage />} />
					<Route path="/sala" element={<Sala />} />
				</Routes>
			</Router>
		</AuthProvider>
	);
}

export default App;
