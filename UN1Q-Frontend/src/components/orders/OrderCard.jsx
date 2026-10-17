import styles from "../../styles/OrdersPage.module.css";
import { formatDate, STATUS_CONFIG, PLACEHOLDER } from "../../utils/orderUtils";

const OrderCard = ({ order, onViewDetails }) => {
  const { orderId, items = [], total, placedAt, status = "Processing" } = order;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Processing"];

  const visibleImgs = items.slice(0, 2);
  const extra = items.length - 2;

  return (
    <div className={styles.orderCard}>
      
      {/* TOP META */}
      <div className={styles.orderMeta}>
        
        {/* LEFT */}
        <div className={styles.orderRef}>
          <p className={styles.orderRefLabel}>ORDER REFERENCE</p>
          <p className={styles.orderRefVal}>#{orderId}</p>
        </div>

        {/* RIGHT */}
        <div className={styles.orderMetaRight}>
          <div className={styles.metaCol}>
            <p className={styles.metaLabel}>DATE</p>
            <p className={styles.metaVal}>{formatDate(placedAt)}</p>
          </div>

          <div className={styles.metaCol}>
            <p className={styles.metaLabel}>TOTAL</p>
            <p className={styles.metaVal}>₹{total}</p>
          </div>

          <div className={styles.metaCol}>
            <p className={styles.metaLabel}>STATUS</p>
            <p className={styles.metaVal}>
              <span
                className={styles.statusDot}
                style={{ background: cfg.color }}
              />
              {status}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className={styles.orderBottom}>
        
        {/* IMAGES */}
        <div className={styles.thumbRow}>
          {visibleImgs.map((item, i) => (
            <img
              key={i}
              className={styles.orderThumb}
              src={item.image}
              onError={(e) => (e.target.src = PLACEHOLDER)}
            />
          ))}

          {extra > 0 && (
            <div className={styles.thumbExtra}>+{extra}</div>
          )}
        </div>

        {/* BUTTON */}
        <button
          className={styles.viewDetailsBtn}
          onClick={() => onViewDetails(order)}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default OrderCard;