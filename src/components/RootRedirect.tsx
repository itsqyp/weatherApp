import { Navigate } from "react-router-dom";

import { getActiveUser } from "../features/auth/storage";

function RootRedirect() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default RootRedirect;
