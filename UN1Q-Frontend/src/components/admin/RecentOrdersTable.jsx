import {useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectAdminOrders,
} from "../../features/admin/adminSlice";
import styles from "../../styles/Admin.module.css";

const STATUS_COLORS = {
  Delivered: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Processing: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  "On Hold": { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  Pending: { bg: "#fefce8", color: "#ca8a04", border: "#fef08a" },
  Dispatched: { bg: "#f0f9ff", color: "#0284c7", border: "#bae6fd" },
  Fulfilled: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_COLORS[status] ?? {
    bg: "#f3f4f6",
    color: "#6b7280",
    border: "#e5e7eb",
  };
  return (
    <span
      className={styles.statusBadge}
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {status}
    </span>
  );
};

const OrderRow = ({ order }) => {
  const firstItem = order.items?.[0];

  return (
    <tr className={styles.tableRow}>
      <td className={styles.tableCell}>
        <div className={styles.productCell}>
          <img
            src={firstItem?.image}
            alt={firstItem?.name}
            className={styles.productThumb}
            onError={(e) => (e.target.style.background = "#e5e7eb")}
          />
          <span>{firstItem?.name ?? "—"}</span>
        </div>
      </td>
      <td className={styles.tableCell}>{order.userName ?? "—"}</td>
      <td className={styles.tableCell}>
        ₹{(order.total ?? 0).toLocaleString("en-IN")}
      </td>
      <td className={styles.tableCell}>
        <StatusBadge status={order.status} />
      </td>
    </tr>
  );
};

const RecentOrdersTable = () => {
  const orders = useSelector(selectAdminOrders);
  const navigate = useNavigate()

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
    .slice(0, 3);



  return (
    <div className={styles.recentOrdersCard}>
      <div className={styles.recentOrdersHeader}>
        <h3 className={styles.chartTitle}>Recent Orders</h3>

        <button
          className={styles.viewAllBtn}
          onClick={() =>  navigate("/admin/orders")}
        >
          View All
        </button>
      </div>

      {recentOrders.length === 0 ? (
        <div className={styles.emptyChart}>No orders yet</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              {["PRODUCT", "CUSTOMER", "PRICE", "STATUS"].map((h) => (
                <th key={h} className={styles.tableHead}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <OrderRow key={order.id} order={order}  />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecentOrdersTable;
