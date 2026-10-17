import { useSelector } from "react-redux";
import styles from "../../styles/Admin.module.css";





const UserProfile = ({ user }) => (
  <div className={styles.topProfile}>
    <div className={styles.topProfileText}>
      <p className={styles.topProfileName}>Curator Profile</p>
      <p className={styles.topProfileRole}>Master Admin</p>
    </div>
    <div className={styles.topAvatar}>
      {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
    </div>
  </div>
);


const AdminTopBar = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarRight}>
        <UserProfile user={user} />
      </div>
    </header>
  );
};

export default AdminTopBar;