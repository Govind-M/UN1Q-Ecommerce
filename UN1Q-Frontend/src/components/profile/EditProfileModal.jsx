import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../features/auth/authSlice";
import styles from "../../styles/ProfilePage.module.css";

const EditProfileModal = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const [form, setForm]     = useState({ name: "", email: "", phone: "", avatar: "" });
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setForm({
      name:   user.name   ?? "",
      email:  user.email  ?? "",
      phone:  user.phone  ?? "",
      avatar: user.avatar ?? "",
    });
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === "avatar") setImgError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await dispatch(updateProfile({
      userId: user.id,
      updates: { name: form.name, email: form.email, phone: form.phone, avatar: form.avatar },
    }));
    setSaving(false);
    onClose();
  };

  const initials = user.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Profile</h2>
          <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalAvatarRow}>
            {form.avatar && !imgError ? (
              <img
                src={form.avatar}
                alt="preview"
                className={styles.modalAvatarPreview}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={styles.modalAvatarFallback}>{initials}</div>
            )}
            <div className={styles.modalAvatarField}>
              <label className={styles.modalFieldLabel}>Profile Picture URL</label>
              <input
                name="avatar"
                value={form.avatar}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className={styles.modalInput}
              />
            </div>
          </div>

          <div className={styles.modalGrid}>
            <div className={`${styles.modalField} ${styles.modalFullRow}`}>
              <label className={styles.modalFieldLabel}>Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className={styles.modalInput}
                required
              />
            </div>

            <div className={styles.modalField}>
              <label className={styles.modalFieldLabel}>Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={styles.modalInput}
                required
              />
            </div>

            <div className={styles.modalField}>
              <label className={styles.modalFieldLabel}>Phone Number</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={styles.modalInput}
              />
            </div>
          </div>

          <button type="submit" className={styles.modalSubmitBtn} disabled={saving}>
            {saving ? "Updating…" : "Update Profile"}
          </button>
          <button type="button" className={styles.modalCancelBtn} onClick={onClose}>
            Cancel Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;