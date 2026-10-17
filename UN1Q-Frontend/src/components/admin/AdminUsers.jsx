import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsersByAdmin,
  selectUsersByAdmin,
  selectUserSearch,
  setUserSearch,
  toggleUserBlock,
} from "../../features/admin/adminSlice";
import UserDetailModal from "./UserDetailModal";
import styles from "../../styles/Admin.module.css";

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

const UserAvatar = ({ name, blocked }) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`${styles.userAvatar} ${blocked ? styles.avatarBlocked : ""}`}
    >
      {initials}
    </div>
  );
};

const UserRow = ({ user, onToggleBlock, onView }) => {
  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <tr className={styles.tableRow}>
      <td className={styles.tableCell}>
        <div className={styles.userCell}>
          <UserAvatar name={user.name} blocked={user.isBlocked} />
          <div>
            <p className={styles.userName}>{user.name}</p>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
        </div>
      </td>
      <td className={styles.tableCell}>{user.role}</td>
      <td className={styles.tableCell}>{joined}</td>
      <td className={styles.tableCell}>
        <span
          className={`${styles.statusBadge} ${
            user.isBlocked ? styles.badgeBlocked : styles.badgeActive
          }`}
        >
          {user.isBlocked ? "BLOCKED" : "ACTIVE"}
        </span>
      </td>
      <td className={styles.tableCell}>
        <div className={styles.actionBtns}>
          {" "}
          <button
          type="button"
            className={styles.viewBtn}
            onClick={(e) => {
              e.stopPropagation();
              onView(user);
            }}
          >
            VIEW
          </button>
          <button
          type="button"
            className={user.isBlocked ? styles.enableBtn : styles.disableBtn}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBlock(user);
            }}
          >
            {user.isBlocked ? "UNBLOCK" : "BLOCK"}
          </button>
        </div>
      </td>
    </tr>
  );
};

const UsersStatsBar = ({ users }) => {
  const total = users.length;
  const active = users.filter((u) => !u.isBlocked).length;
  const blocked = users.filter((u) => u.isBlocked).length;

  return (
    <div className={styles.usersStatsBar}>
      <div className={styles.usersStat}>
        <span className={styles.usersStatVal}>{total}</span>
        <span className={styles.usersStatLabel}>Total Users</span>
      </div>
      <div className={styles.usersStat}>
        <span className={`${styles.usersStatVal} ${styles.statGreen}`}>
          {active}
        </span>
        <span className={styles.usersStatLabel}>Active</span>
      </div>
      <div className={styles.usersStat}>
        <span className={`${styles.usersStatVal} ${styles.statRed}`}>
          {blocked}
        </span>
        <span className={styles.usersStatLabel}>Blocked</span>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const ITEMS_PER_PAGE = 10;

  const dispatch = useDispatch();
  const users = useSelector(selectUsersByAdmin);
  const searchQuery = useSelector(selectUserSearch);
  const status = useSelector((s) => s.admin.usersStatus);

  useEffect(() => {
    if (status === "idle") dispatch(fetchUsersByAdmin());
  }, [dispatch, status]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedUsers = filtered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Users</h1>
      </div>

      <UsersStatsBar users={users} />

      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => dispatch(setUserSearch(e.target.value))}
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
          <div className={styles.emptyChart}>No users found</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  {["USER", "ROLE", "JOINED", "STATUS", "ACTIONS"].map((h) => (
                    <th key={h} className={styles.tableHead}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onView={(u) => setSelectedUser(u)}
                    onToggleBlock={(u) =>
                      dispatch(
                        toggleUserBlock({ id: u.id, isBlocked: u.isBlocked }),
                      )
                    }
                  />
                ))}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length} users
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

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
