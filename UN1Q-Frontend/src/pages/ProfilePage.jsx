
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { setGender } from "../features/ui/uiSlice";
import EditProfileModal from "../components/profile/EditProfileModal";
import ChangePasswordModal from "../components/profile/ChangePasswordModal";
import styles from "../styles/ProfilePage.module.css";

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.9a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 18.92z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const ProfilePage = () => {
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const user         = useSelector((state) => state.auth.user);
  const activeGender = useSelector((state) => state.ui.activeGender);

  const [showEditModal,     setShowEditModal]     = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [imgError,          setImgError]          = useState(false);

  if (!user) {
    navigate("/login");
    return null;
  }

  const initials = user.name
    ?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <Navbar
        activeCategory={activeGender}
        onCategoryChange={(c) => dispatch(setGender(c))}
      />

      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <span>ACCOUNT</span>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbActive}>PROFILE</span>
        </div>

        <div className={styles.hero}>
          <div className={styles.avatarWrap}>
            {user.avatar && !imgError ? (
              <img
                src={user.avatar}
                alt={user.name}
                className={styles.avatar}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={styles.avatarFallback}>{initials}</div>
            )}
            <button
              className={styles.cameraBtn}
              onClick={() => setShowEditModal(true)}
              title="Change photo"
            >
              <CameraIcon />
            </button>
          </div>

          <h1 className={styles.heroName}>{user.name}</h1>

          <button
            className={styles.editProfileBtn}
            onClick={() => setShowEditModal(true)}
          >
            Edit Profile
          </button>
        </div>

        <div className={styles.securityCard}>
          <div className={styles.securityHeader}>
            <ShieldIcon />
            <h2 className={styles.securityTitle}>Account Security</h2>
          </div>

          <div className={styles.securityGrid}>
            <div className={styles.securityField}>
              <p className={styles.securityLabel}>Email Address</p>
              <div className={styles.securityValue}>
                <span className={styles.securityValueIcon}><EmailIcon /></span>
                <span>{user.email}</span>
              </div>
            </div>

            <div className={styles.securityField}>
              <p className={styles.securityLabel}>Phone Number</p>
              <div className={styles.securityValue}>
                <span className={styles.securityValueIcon}><PhoneIcon /></span>
                <span>{user.phone ?? "Not set"}</span>
              </div>
            </div>

            <div className={styles.securityField}>
              <p className={styles.securityLabel}>Password</p>
              <div className={styles.securityValue}>
                <span className={styles.securityValueIcon}><LockIcon /></span>
                <span>••••••••</span>
                <button
                  className={styles.updateBtn}
                  onClick={() => setShowPasswordModal(true)}
                >
                  UPDATE
                </button>
              </div>
            </div>

            <div className={styles.securityField}>
              <p className={styles.securityLabel}>Gender</p>
              <div className={styles.securityValue}>
                <span style={{ textTransform: "capitalize" }}>
                  {user.gender === "prefer_not" ? "Prefer not to say" : user.gender ?? "Not set"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          user={user}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </>
  );
};

export default ProfilePage;