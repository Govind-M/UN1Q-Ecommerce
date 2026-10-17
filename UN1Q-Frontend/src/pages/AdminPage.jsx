import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";

import {
  fetchUsersByAdmin,
  fetchAdminOrders,
} from "../features/admin/adminSlice";

import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopBar from "../components/admin/AdminTopbar";
import styles from "../styles/Admin.module.css";

const AdminPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/home", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    dispatch(fetchUsersByAdmin());
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <div className={styles.adminMain}>
        <AdminTopBar />
        <main className={styles.adminBody}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
