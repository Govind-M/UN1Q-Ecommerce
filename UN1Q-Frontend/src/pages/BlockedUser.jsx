// src/pages/BlockedUser.jsx
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import styles from "../styles/BlockedUser.module.css";

const LockIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ArrowIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const BlockedUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const blockedWhileLoggedIn = useSelector(
    (state) => state.auth.blockedWhileLoggedIn,
  );

  const handleReturnToLogin = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className={styles.page}>
      <p className={styles.brand}>UN1Q</p>

      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <LockIcon />
        </div>

        <h1 className={styles.title}>Account Access Restricted</h1>

        {blockedWhileLoggedIn ? (
          <p className={styles.subtitle}>
            Your session has been terminated by an administrator. Your account
            access has been suspended. If you believe this is a mistake, please
            reach out to our support team.
          </p>
        ) : (
          <p className={styles.subtitle}>
            Your account has been suspended and you are unable to sign in at
            this time. We appreciate your patience. Please contact our support
            team if you believe this is an error.
          </p>
        )}

        <div className={styles.actions}>
          <a href="mailto:support@un1q.com" className={styles.contactBtn}>
            Contact Support <ArrowIcon />
          </a>

          <button className={styles.returnBtn} onClick={handleReturnToLogin}>
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockedUser;
