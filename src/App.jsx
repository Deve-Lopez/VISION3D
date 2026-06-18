import { useState } from "react";
import Dashboard from "./components/Dashboard/Dashboard";
import Landing from "./components/Landing/Landing";
import "./index.css";

export default function App() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    // Le pasamos la función para volver atrás
    return <Dashboard onBack={() => setShowApp(false)} />;
  }

  return <Landing onLaunch={() => setShowApp(true)} />;
}