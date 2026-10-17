import styles from "../../styles/OrdersPage.module.css";
import { effectivePrice, PLACEHOLDER } from "../../utils/orderUtils";

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  const { orderId, items = [], subtotal, shipping, tax, total } = order;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT SIDE */}
        <div className={styles.modalLeft}>
          <div className={styles.modalLeftInner}>
            <p className={styles.modalCuratedBy}>CURATED BY</p>
            <p className={styles.modalBrandName}>UNIQ Gallery</p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className={styles.modalRight}>
          <button className={styles.modalClose} onClick={onClose}>✕</button>

          <p className={styles.modalEyebrow}>RECEIPT & SUMMARY</p>
          <h2 className={styles.modalOrderId}>{orderId}</h2>

          {/* ITEMS */}
          <div className={styles.modalItems}>
            {items.map((item, idx) => {
              const finalPrice = effectivePrice(item.price, item.discount);

              return (
                <div key={idx} className={styles.modalItem}>
                  <img
                    className={styles.modalItemImg}
                    src={item.image}
                    onError={(e) => (e.target.src = PLACEHOLDER)}
                  />

                  <div className={styles.modalItemInfo}>
                    <p className={styles.modalItemName}>{item.name}</p>
                    <p className={styles.modalItemMeta}>
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <p className={styles.modalItemPrice}>
                    ₹{finalPrice * item.quantity}
                  </p>
                </div>
              );
            })}
          </div>

          <div className={styles.modalDivider} />

          {/* PRICE SUMMARY */}
          <div className={styles.modalPriceRow}>
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className={styles.modalPriceRow}>
            <span>Shipping</span>
            <span className={styles.free}>
              {shipping === 0 ? "Free" : `₹${shipping}`}
            </span>
          </div>

          <div className={styles.modalPriceRow}>
            <span>Tax</span>
            <span>₹{tax}</span>
          </div>

          <div className={`${styles.modalPriceRow} ${styles.modalTotal}`}>
            <span>Total</span>
            <span>₹{total}</span>
          </div>

          <button className={styles.modalCloseBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;