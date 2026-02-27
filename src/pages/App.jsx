import { Outlet } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";

export default function AppLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
