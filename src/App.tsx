import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";

import CreateAccount from "./pages/CreateAccount";
import Home from "./pages/Home";
import Login from "./pages/Login";

import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./components/RootRedirect";

function App() {
  return (
    <MotionConfig reducedMotion={import.meta.env.DEV ? "never" : "user"}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
          </Route>

          <Route path="/createAccount" element={<CreateAccount />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
