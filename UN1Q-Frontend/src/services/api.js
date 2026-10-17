import api from "./axiosInstance";
import { fetchProductsByCategory, CATEGORIES } from "./categoryApi";

export const getAllUsers = async () => {
  try {
    const response = await api.get("/accounts/users/");
    return response.data.results || response.data;
  } catch (err) {
    throw new Error("Failed to fetch users");
  }
};

export const getUsersWithUserRole = async () => {
  try {
    const response = await api.get("/accounts/users/?role=user");
    return response.data.results || response.data;
  } catch (error) {
    throw new Error("Failed to fetch user");
  }
};

export const getUserByEmail = async (email) => {
  try {
    const response = await api.get("/accounts/users/", {
      params: { email },
    });
    const results = response.data.results || response.data;
    return Array.isArray(results) ? results[0] || null : results;
  } catch {
    return null;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post("/accounts/register/", {
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      name: userData.name.trim(),
    });
    return response.data;
  } catch (err) {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.email?.[0] ||
      "Registration failed";
    throw new Error(msg);
  }
};

export const loginUserApi = async ({ email, password }) => {
  const response = await api.post("/accounts/login/", {
    email: email.toLowerCase().trim(),
    password: password,
  });
  return response.data; // { access, refresh, user }
};

export const createOrder = async (orderData) => {
  try {
    const res = await api.post("/orders/", orderData);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || "Failed to create order");
  }
};

export const getAllOrders = async () => {
  try {
    const res = await api.get("/orders/");
    return res.data.results || res.data;
  } catch (error) {
    throw new Error("Failed to fetch orders");
  }
};

export const getOrdersByUser = async (userId) => {
  try {
    const res = await api.get("/orders/");
    return res.data.results || res.data;
  } catch (error) {
    throw new Error("Failed to fetch user orders");
  }
};

export const getAllProducts = async () => {
  try {
    const response = await api.get("/catalog/products/");
    return response.data.results || response.data;
  } catch {
    return [];
  }
};

export const addProduct = async (categoryId, productData) => {
  const payload = {
    ...productData,
    category_slug: categoryId,
  };
  const { data } = await api.post("/catalog/products/", payload);
  return data;
};

export const updateProduct = async (categoryId, productId, productData) => {
  const { data } = await api.patch(`/catalog/products/${productId}/`, productData);
  return data;
};

export const blockUser = async (userId, isBlocked) => {
  const { data } = await api.patch(`/accounts/users/${userId}/`, { is_blocked: isBlocked });
  return data;
};

export const patchOrderStatus = async (orderId, status) => {
  const { data } = await api.patch(`/orders/${orderId}/update_status/`, { status });
  return data;
};

export const removeOrder = async (orderId) => {
  await api.delete(`/orders/${orderId}/`);
  return orderId;
};

export const toggleProductStatus = async (categoryId, productId, status) => {
  const { data } = await api.patch(`/catalog/products/${productId}/`, { status });
  return data;
};

export const updateUserProfile = async (userId, updates) => {
  const { data } = await api.patch(`/accounts/users/${userId}/`, updates);
  return data;
};

// Cart APIs
export const getCart = async () => {
  const response = await api.get("/cart/");
  return response.data;
};

export const addToCart = async ({ productId, selectedSize, selectedColor = "", quantity = 1 }) => {
  const response = await api.post("/cart/add/", {
    product_id: productId,
    selected_size: selectedSize,
    selected_color: selectedColor,
    quantity: quantity,
  });
  return response.data;
};

export const updateCartItemQuantity = async ({ productId, selectedSize, action }) => {
  const response = await api.post("/cart/update_quantity/", {
    product_id: productId,
    selected_size: selectedSize,
    action: action,
  });
  return response.data;
};

export const removeFromCart = async ({ productId, selectedSize }) => {
  const response = await api.post("/cart/remove/", {
    product_id: productId,
    selected_size: selectedSize,
  });
  return response.data;
};

export const mergeGuestCart = async (guestToken) => {
  const response = await api.post("/cart/merge/", { guest_token: guestToken });
  return response.data;
};

export const validateCouponApi = async (code, cartTotal) => {
  try {
    const response = await api.post("/cart/coupons/validate_coupon/", {
      code: code.trim(),
      cart_total: cartTotal,
    });
    return response.data;
  } catch (err) {
    const data = err.response?.data;
    let msg = "Invalid coupon code.";

    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstErr = data.errors[0];
      msg = firstErr.messages?.[0] || firstErr.message || msg;
    } else if (data?.coupon) {
      msg = Array.isArray(data.coupon) ? data.coupon[0] : data.coupon;
    } else if (data?.code) {
      msg = Array.isArray(data.code) ? data.code[0] : data.code;
    } else if (data?.cart) {
      msg = Array.isArray(data.cart) ? data.cart[0] : data.cart;
    } else if (data?.detail) {
      msg = data.detail;
    }

    throw new Error(msg);
  }
};

// Razorpay Payment APIs
export const createRazorpayOrder = async (orderId) => {
  const response = await api.post("/payments/razorpay/create-order/", { order_id: orderId });
  return response.data;
};

export const verifyRazorpayPayment = async (paymentData) => {
  const response = await api.post("/payments/razorpay/verify/", paymentData);
  return response.data;
};

export const processRazorpayPayment = async ({ orderId, user, onSuccess, onError, onDismiss }) => {
  try {
    const data = await createRazorpayOrder(orderId);

    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "UN1Q Store",
      description: `Order #${orderId}`,
      order_id: data.razorpay_order_id,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
      },
      handler: async (response) => {
        try {
          await verifyRazorpayPayment({
            order_id: orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (onSuccess) onSuccess(response);
        } catch (err) {
          if (onError) onError(err.message || "Payment verification failed.");
        }
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) {
            onDismiss();
          } else if (onSuccess) {
            onSuccess();
          }
        },
      },
      theme: { color: "#0F172A" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    if (onError) onError(err.message || "Failed to start payment process.");
  }
};

// Inventory

export const getInventorySummary = async () => {
  try {
    const response = await api.get("/catalog/inventory/summary/");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Failed to fetch inventory summary");
  }
};


export const getInventoryList = async ({ page = 1, search = "", category = "", status = "" } = {}) => {
  try {
    const params = { page };
    if (search) params.search = search;
    if (category) params.category = category;
    if (status) params.status = status;
    const response = await api.get("/catalog/inventory/", { params });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Failed to fetch inventory list");
  }
};


export const updateVariantStock = async (variantId, stockQuantity) => {
  try {
    const response = await api.patch(`/catalog/inventory/${variantId}/`, {
      stock_quantity: parseInt(stockQuantity, 10),
    });
    return response.data;
  } catch (err) {
    const data = err.response?.data;
    const msg = data?.stock_quantity?.[0] || data?.detail || "Failed to update stock quantity";
    throw new Error(msg);
  }
};