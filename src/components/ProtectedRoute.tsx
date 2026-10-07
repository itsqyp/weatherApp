import { Navigate, Outlet } from "react-router-dom";

import { getActiveUser } from "../features/auth/storage";

function ProtectedRoute() {
  const activeUser = getActiveUser();

  if (!activeUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
