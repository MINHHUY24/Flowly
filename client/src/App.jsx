import { Navigate, Route, Routes } from "react-router-dom";

import ConfirmLoginPage from "./pages/ConfirmLoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SchedulePage from "./pages/SchedulePage";
import TasksPage from "./pages/TasksPage";
import ProtectedLayout from "./layouts/ProtectedLayout";
import DeleteDataPage from "./pages/DeleteDataPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/confirm-login" element={<ConfirmLoginPage />} />
      <Route path="/delete-data" element={<DeleteDataPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
