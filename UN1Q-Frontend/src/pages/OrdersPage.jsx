import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import OrderCard from "../components/orders/OrderCard";
import OrderDetailModal from "../components/orders/OrderDetailModal";
import { setGender } from "../features/ui/uiSlice";
import styles from "../../src/styles/OrdersPage.module.css";
import { fetchUserOrders } from "@/features/checkout/checkoutSlice";

const OrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activeGender = useSelector((state) => state.ui.activeGender);
  const orderHistory = useSelector(
    (state) => state.checkout?.orderHistory ?? [],
  );
  const user = useSelector((state) => state.auth.user);

  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserOrders(user.id));
    }
  }, [user, dispatch]);

  return (
    <>
      <Navbar
        activeCategory={activeGender}
        onCategoryChange={(c) => dispatch(setGender(c))}
      />

      <div className={styles.page}>

        <div className={styles.pageHero}>
          <h1 className={styles.pageTitle}>My Orders</h1>
          <p className={styles.pageSubtitle}>
            Track, manage, and revisit your curated collection of UNIQ
            essentials.
          </p>
        </div>


        <div className={styles.ordersList}>
          {orderHistory.length === 0 ? (
            <p>No Orders</p>
          ) : (
            orderHistory.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={setSelectedOrder}
              />
            ))
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
};

export default OrdersPage;
