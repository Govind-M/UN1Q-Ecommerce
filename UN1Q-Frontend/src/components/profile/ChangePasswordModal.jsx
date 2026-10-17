
import { useState } from "react";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../features/auth/authSlice";
import styles from "../../styles/ProfilePage.module.css";

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ChangePasswordModal = ({ user, onClose }) => {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false, newPass: false, confirm: false,
  });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const toggleShow = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.currentPassword !== user.password) {
      setError("Current password is incorrect.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    await dispatch(updateProfile({
      userId:  user.id,
      updates: { password: form.newPassword }, 
    }));
    setSaving(false);
    setSuccess(true);

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Change Password</h2>
          <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        {success && (
          <p className={styles.successText}>✅ Password updated successfully!</p>
        )}
        {error && (
          <p className={styles.errorText}>⚠ {error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.modalGrid} style={{ gridTemplateColumns: "1fr" }}>

            <div className={styles.modalField}>
              <label className={styles.modalFieldLabel}>Current Password</label>
              <div className={styles.passwordField}>
                <input
                  name="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  className={styles.modalInput}
                  required
                />
                <button type="button" className={styles.passwordToggle} onClick={() => toggleShow("current")}>
                  <EyeIcon open={showPasswords.current} />
                </button>
              </div>
            </div>

            <div className={styles.modalField}>
              <label className={styles.modalFieldLabel}>New Password</label>
              <div className={styles.passwordField}>
                <input
                  name="newPassword"
                  type={showPasswords.newPass ? "text" : "password"}
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className={styles.modalInput}
                  required
                />
                <button type="button" className={styles.passwordToggle} onClick={() => toggleShow("newPass")}>
                  <EyeIcon open={showPasswords.newPass} />
                </button>
              </div>
            </div>

            <div className={styles.modalField}>
              <label className={styles.modalFieldLabel}>Confirm New Password</label>
              <div className={styles.passwordField}>
                <input
                  name="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat new password"
                  className={styles.modalInput}
                  required
                />
                <button type="button" className={styles.passwordToggle} onClick={() => toggleShow("confirm")}>
                  <EyeIcon open={showPasswords.confirm} />
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className={styles.modalSubmitBtn} disabled={saving || success}>
            {saving ? "Updating…" : success ? "Done ✓" : "Update Password"}
          </button>
          <button type="button" className={styles.modalCancelBtn} onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;