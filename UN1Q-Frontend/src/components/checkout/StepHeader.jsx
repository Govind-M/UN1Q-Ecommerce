import styles from "../../styles/CheckoutPage.module.css";



const StepHeader = ({ number, title }) => (
  <div className={styles.stepHeader}>
    <span className={styles.stepNum}>{number}</span>
    <h2 className={styles.stepTitle}>{title}</h2>
  </div>
);

export default StepHeader;