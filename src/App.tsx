import { BrowserRouter, Route, Routes } from "react-router-dom";

import CreateAccount from "./pages/CreateAccount";
import Home from "./pages/Home";
import Login from "./pages/Login";

import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./components/RootRedirect";

function App() {
  return (
    <BrowserRouter>
      {" "}
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
        </Route>

        <Route path="/createAccount" element={<CreateAccount />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
