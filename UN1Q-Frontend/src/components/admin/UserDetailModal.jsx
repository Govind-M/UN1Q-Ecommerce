import { useSelector } from "react-redux";
import { selectUserOrderStats } from "../../features/admin/adminSlice";
import styles from "../../styles/Admin.module.css";

const InfoCard = ({ icon, label, value }) => (
  <div className={styles.userModalCard}>
    <div className={styles.userModalCardHeader}>
      <span className={styles.userModalCardIcon}>{icon}</span>
      <span className={styles.userModalCardLabel}>{label}</span>
    </div>
    <p className={styles.userModalCardValue}>{value}</p>
  </div>
);

const ModalAvatar = ({ name }) => {
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  return <div className={styles.userModalAvatar}>{initials}</div>;
};

const UserDetailModal = ({ user, onClose }) => {
  const stats = useSelector((state) => selectUserOrderStats(state, user?.id));

  if (!user) return null;

  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.userDetailModal}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.userModalCloseBtn} onClick={onClose}>
          ✕
        </button>

        <div className={styles.userModalHeader}>
          <ModalAvatar name={user.name} />
          <div className={styles.userModalInfo}>
            <div className={styles.userModalNameRow}>
              <h2 className={styles.userModalName}>{user.name}</h2>
              <span
                className={`${styles.statusBadge} ${
                  user.isBlocked ? styles.badgeBlocked : styles.badgeActive
                }`}
              >
                {user.isBlocked ? "BLOCKED" : "ACTIVE"}
              </span>
            </div>
            <p className={styles.userModalEmail}>{user.email}</p>
            <div className={styles.userModalIdRow}>
              <span className={styles.userModalIdDot} />
              <span className={styles.userModalId}>ID: #{user.id}</span>
            </div>
          </div>
        </div>

        <div className={styles.userModalGrid}>
          <InfoCard
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            label="ACCOUNT ROLE"
            value={user.role === "admin" ? "Admin" : "User"}
          />
          <InfoCard
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            label="MEMBER SINCE"
            value={joined}
          />
          <InfoCard
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            }
            label="TOTAL ORDERS"
            value={stats.totalOrders}
          />
          <InfoCard
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
            label="TOTAL CONTRIBUTION"
            value={`₹${stats.totalContribution.toLocaleString("en-IN")}`}
          />
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
