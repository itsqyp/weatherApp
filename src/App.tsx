import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";

import CreateAccount from "./pages/CreateAccount";
import Home from "./pages/Home";
import Login from "./pages/Login";
import WeatherDetails from "./pages/WeatherDetails";

import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./components/RootRedirect";
import MusicPlayerButton from "./components/MusicPlayerButton";
import About from "./pages/About";
// import Account from "./pages/Account";

function App() {
  return (
    <MotionConfig reducedMotion={import.meta.env.DEV ? "never" : "user"}>
      <BrowserRouter>
        {/* One persistent music player for the entire app */}
        <MusicPlayerButton />

        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route path="/login" element={<Login />} />
          <Route path="/createAccount" element={<CreateAccount />} />
          <Route path="/about" element={<About />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/weather-details" element={<WeatherDetails />} />
            {/* <Route path="/account" element={<Account />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
