import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminOrders,
  selectAdminOrders,
  selectOrderSearch,
  setOrderSearch,
  updateOrderStatus,
  deleteOrder,
  selectUsersByAdmin,
} from "../../features/admin/adminSlice";
import styles from "../../styles/Admin.module.css";

const STATUS_OPTIONS = ["Processing", "Dispatched", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  delivered: "#16a34a",
  dispatched: "#2563eb",
  shipped: "#2563eb",
  processing: "#ca8a04",
  pending: "#ca8a04",
  cancelled: "#dc2626",
};

const StatusDropdown = ({ orderId, current, onChange }) => {
  const normCurrent = (current || "").toLowerCase();
  const displayStatus = (normCurrent === "shipped" || normCurrent === "dispatched")
    ? "Dispatched"
    : current
    ? current.charAt(0).toUpperCase() + current.slice(1)
    : "Processing";

  return (
    <div className={styles.statusDropdown}>
      <span
        style={{
          color: STATUS_COLORS[normCurrent] ?? "#374151",
          fontWeight: 600,
          fontSize: "13px",
        }}
      >
        {displayStatus}
      </span>
      <select
        className={styles.statusSelect}
        value={displayStatus}
        onChange={(e) => {
          e.stopPropagation();
          onChange(orderId, e.target.value);
        }}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
};

const OrderUserAvatar = ({ name }) => {
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return <div className={styles.orderAvatarInitials}>{initials}</div>;
};

const ProductThumbs = ({ items = [] }) => {
  const visible = items.slice(0, 2);
  const extra = items.length - 2;

  return (
    <div className={styles.thumbGroup}>
      {visible.map((item, i) => (
        <img
          key={i}
          src={item.image}
          alt={item.name}
          className={styles.orderProductThumb}
          onError={(e) => (e.target.style.background = "#e5e7eb")}
        />
      ))}
      {extra > 0 && <span className={styles.thumbExtra}>+{extra}</span>}
    </div>
  );
};

const OrderRow = ({ order, user, onStatusChange, onDelete }) => {
  const date = new Date(order.placedAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const userName = user?.name ?? order.userName ?? order.userId ?? "Unknown";
  const userEmail = user?.email ?? order.userEmail ?? "—";

  return (
    <tr className={styles.tableRow}>
      <td className={styles.tableCell}>
        <span className={styles.orderId}>#{order.id}</span>
      </td>

      <td className={styles.tableCell}>
        <div className={styles.userCell}>
          <OrderUserAvatar name={userName} />
          <div>
            <p className={styles.userName}>{userName}</p>
            <p className={styles.userEmail}>{userEmail}</p>
          </div>
        </div>
      </td>

      <td className={styles.tableCell}>
        <p className={styles.orderDate}>{dateStr}</p>
        <p className={styles.orderTime}>{timeStr}</p>
      </td>

      <td className={styles.tableCell}>
        <ProductThumbs items={order.items} />
      </td>

      <td className={styles.tableCell}>
        <span className={styles.orderTotal}>
          ₹{Number(order.total || 0).toLocaleString("en-IN")}
        </span>
      </td>

      <td className={styles.tableCell}>
        <StatusDropdown
          orderId={order.id}
          current={order.status}
          onChange={onStatusChange}
        />
      </td>

      <td className={styles.tableCell}>
        <div className={styles.actionBtns}>
          <button
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(order.id);
            }}
          >
            DELETE
          </button>
        </div>
      </td>
    </tr>
  );
};

const getPagination = (currentPage, totalPages) => {
  const pages = [];
  const maxVisible = 5;

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) {
    start = 1;
    end = Math.min(totalPages, maxVisible);
  }

  if (currentPage >= totalPages - 2) {
    start = Math.max(1, totalPages - (maxVisible - 1));
    end = totalPages;
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return pages;
};

const AdminOrders = () => {
  const dispatch = useDispatch();
  const orders = useSelector(selectAdminOrders);
  const users = useSelector(selectUsersByAdmin);
  const searchQuery = useSelector(selectOrderSearch);
  const status = useSelector((s) => s.admin.ordersStatus);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (status === "idle") dispatch(fetchAdminOrders());
  }, [dispatch, status]);

  const getUserById = (userId) => users.find((u) => u.id === userId);

  const filtered = orders.filter((o) => {
    const user = getUserById(o.userId);
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      user?.name?.toLowerCase().includes(q) ||
      user?.email?.toLowerCase().includes(q) ||
      o.userName?.toLowerCase().includes(q) ||
      o.userEmail?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedOrders = filtered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleStatusChange = (id, newStatus) => {
    dispatch(updateOrderStatus({ id, status: newStatus }));
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this order?")) dispatch(deleteOrder(id));
  };

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Order Archive</h1>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by user name"
            value={searchQuery}
            onChange={(e) => dispatch(setOrderSearch(e.target.value))}
            className={styles.searchBoxInput}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        {status === "loading" ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyChart}>No orders found</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  {[
                    "ORDER ID",
                    "USER",
                    "DATE & TIME",
                    "PRODUCTS",
                    "TOTAL",
                    "STATUS",
                    "ACTIONS",
                  ].map((h) => (
                    <th key={h} className={styles.tableHead}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    user={getUserById(order.userId)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length} orders
              </span>

              <div className={styles.paginationBtns}>
                <button
                  className={styles.pagBtn}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ‹
                </button>

                {getPagination(currentPage, totalPages).map((item, index) =>
                  item === "..." ? (
                    <span key={`dots-${index}`} className={styles.pagEllipsis}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={`${item}-${index}`}
                      className={`${styles.pagBtn} ${
                        currentPage === item ? styles.pagBtnActive : ""
                      }`}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  className={styles.pagBtn}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
