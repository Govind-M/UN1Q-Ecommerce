
import DashboardStats from "./DashboardStats";
import OrdersOverviewChart from "./OrdersOverviewChart";
import EarningsOverviewChart from "./EarningsOverviewChart";
import RecentOrdersTable from "./RecentOrdersTable";
import styles from "../../styles/Admin.module.css";

const AdminDashboard = () => {
  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      <DashboardStats />

      <div className={styles.chartsRow}>
        <OrdersOverviewChart />
        <EarningsOverviewChart />
      </div>

      <RecentOrdersTable />
    </div>
  );
};

export default AdminDashboard;