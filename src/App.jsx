import './App.css'
import Login from './Components/Login/Login'
import Home from './Components/Home/Inicio/Home.jsx';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sala from './Components/Rooms/Sala.jsx';

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path='/Home' element={<Home />}/>
        <Route path='/sala' element={<Sala/>}/>
      </Routes>
    </Router>
  )
}

export default App
