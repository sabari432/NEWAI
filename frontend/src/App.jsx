import React, { useState } from "react";
import Login from "./components/Login";
import WordTrainer from "./components/WordTrainer";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return isLoggedIn ? (
    <WordTrainer />
  ) : (
    <Login onLoginSuccess={() => setIsLoggedIn(true)} />
  );
}

export default App;
