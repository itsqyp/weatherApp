import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getActiveUser } from "../features/auth/storage";

function ProtectedRoute() {
  const activeUser = getActiveUser();
  const location = useLocation();

  if (!activeUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
