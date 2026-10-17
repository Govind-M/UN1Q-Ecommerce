import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import { setGender } from "../features/ui/uiSlice";

import {
  selectCartItems,
  selectCartTotal,
  clearCart,
} from "../features/cart/cartSlice";

import {
  selectShippingDetails,
  selectOrderStatus,
  selectShippingCost,
  placeOrderAsync,
} from "../features/checkout/checkoutSlice";

import ShippingDetailsSection from "../components/checkout/ShippingDetailsSection";
import ShippingMethodSection from "../components/checkout/ShippingMethodSection";

import OrderSummary from "../components/checkout/OrderSummary";

import styles from "../styles/CheckoutPage.module.css";

import { processRazorpayPayment } from "../services/api";

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const activeGender = useSelector((state) => state.ui.activeGender);

  const cartItems = useSelector(selectCartItems);

  const user = useSelector((state) => state.auth.user);

  const shipping = useSelector(selectShippingDetails);
  const orderStatus = useSelector(selectOrderStatus);
  const subtotal = useSelector(selectCartTotal);
  const shippingCost = useSelector(selectShippingCost);

  const isLoading = orderStatus === "loading" || isProcessingPayment;

  useEffect(() => {
    if (
      cartItems.length === 0 &&
      orderStatus !== "success" &&
      orderStatus !== "loading" &&
      !isProcessingPayment
    ) {
      navigate("/cart");
    }
  }, [cartItems.length, orderStatus, isProcessingPayment, navigate]);

  const validate = () => {
    if (!shipping.fullName) {
      alert("Please enter your full name.");
      return false;
    }
    if (!shipping.phone) {
      alert("Please enter your phone number.");
      return false;
    }
    if (!shipping.address) {
      alert("Please enter your shipping address.");
      return false;
    }
    if (!shipping.city) {
      alert("Please enter your city.");
      return false;
    }
    if (!shipping.stateRegion) {
      alert("Please enter your state.");
      return false;
    }
    if (!shipping.postalCode) {
      alert("Please enter your postal code.");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    setIsProcessingPayment(true);

    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + shippingCost + tax;

    const resultAction = await dispatch(
      placeOrderAsync({
        orderData: {
          items: cartItems,
          subtotal,
          shipping: shippingCost,
          tax,
          total,
        },
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
      }),
    );

    if (placeOrderAsync.fulfilled.match(resultAction)) {
      const createdOrder = resultAction.payload;

      const finishCheckout = () => {
        dispatch(clearCart());
        setIsProcessingPayment(false);
        navigate("/order-success");
      };

      if (createdOrder?.id) {
        processRazorpayPayment({
          orderId: createdOrder.id,
          user: user,
          onSuccess: () => {
            finishCheckout();
          },
          onDismiss: () => {
            finishCheckout();
          },
          onError: (errMsg) => {
            alert(`Payment status note: ${errMsg}`);
            finishCheckout();
          },
        });
      } else {
        finishCheckout();
      }
    } else {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.successWrap}>
        <div className={styles.spinner} />
        <p className={styles.successSub}>Processing your order…</p>
      </div>
    );
  }

  return (
    <>
      <Navbar
        activeCategory={activeGender}
        onCategoryChange={(c) => dispatch(setGender(c))}
      />

      <div className={styles.breadcrumb}>
        <span className={styles.crumbLink} onClick={() => navigate("/home")}>
          Home
        </span>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbLink} onClick={() => navigate("/cart")}>
          Cart
        </span>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>Checkout</span>
      </div>

      <div className={styles.pageWrap}>
        <h1 className={styles.pageTitle}>Checkout</h1>

        <div className={styles.layout}>
          <div className={styles.steps}>
            <ShippingDetailsSection userName={user?.name} />
            <ShippingMethodSection />
          </div>

          <OrderSummary onPlace={handlePlaceOrder} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
