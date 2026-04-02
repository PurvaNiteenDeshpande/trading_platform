import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Portfolio from "./pages/Portfolio";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      localStorage.removeItem("user");
    }
  }, []);

  return (
    <BrowserRouter>
      {user && <Navbar setUser={setUser} user={user} />}
      <div style={{ padding: "20px" }}>
        <Routes>
          <Route
            path="/"
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} 
          />
          <Route
            path="/orders"
            element={user ? <Orders user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/portfolio"
            element={user ? <Portfolio user={user} /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
