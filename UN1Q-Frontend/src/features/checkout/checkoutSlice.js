import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { loginUser, logout } from "../auth/authSlice";
import { createOrder, getOrdersByUser } from "../../services/api";

// const historyKey = (userId) => `orders_${userId}`;

// const loadHistory = (userId) => {
//   if (!userId) return [];
//   try {
//     const data = localStorage.getItem(historyKey(userId));
//     return data ? JSON.parse(data) : [];
//   } catch {
//     return [];
//   }
// };

// const saveHistory = (userId, history) => {
//   if (!userId) return;
//   localStorage.setItem(historyKey(userId), JSON.stringify(history));
// };

export const placeOrderAsync = createAsyncThunk(
  "checkout/placeOrder",
  async ({ orderData, userId, userName, userEmail }, { rejectWithValue }) => {
    try {
      const newOrder = {
        ...orderData,
        userId,
        userName,
        userEmail,
        status: "Processing",
        placedAt: new Date().toISOString(),
      };

      const created = await createOrder(newOrder);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchUserOrders = createAsyncThunk(
  "checkout/fetchOrders",
  async (userId, { rejectWithValue }) => {
    try {
      const data = await getOrdersByUser(userId);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const getBootUserId = () => {
  try {
    const session = localStorage.getItem("session");
    return session ? JSON.parse(session)?.id : null;
  } catch {
    return null;
  }
};

const bootUserId = getBootUserId();

const initialState = {
  shippingDetails: {
    fullName: "",
    phone: "",
    address: "",
    city: "",
    stateRegion: "",
    postalCode: "",
  },

  shippingMethod: "standard",

  paymentMethod: "card",

  cardDetails: {
    cardNumber: "",
    expiry: "",
    cvv: "",
    upiId: "",
  },

  orderStatus: "idle",
  orderError: null,
  orderSnapshot: null,

  orderHistory: [],
  userId: bootUserId,
};

const generateOrderId = () =>
  `UNIQ-${Math.floor(10000 + Math.random() * 90000)}`;

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    updateShippingField: (state, action) => {
      const { field, value } = action.payload;
      state.shippingDetails[field] = value;
    },
    setShippingMethod: (state, action) => {
      state.shippingMethod = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    resetCheckout: (state) => {
      const { orderHistory, userId } = state;
      Object.assign(state, {
        ...initialState,
        orderHistory,
        userId,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        const userId = action.payload?.id;
        if (userId) {
          state.userId = userId;
        }
      })
      .addCase(logout, (state) => {
        state.orderHistory = [];
        state.orderSnapshot = null;
        state.orderStatus = "idle";
        state.userId = null;
      })
      .addCase(placeOrderAsync.pending, (state) => {
        state.orderStatus = "loading";
        state.orderError = null;
      })

      .addCase(placeOrderAsync.fulfilled, (state, action) => {
        state.orderStatus = "success";

        state.orderSnapshot = action.payload;

        // Add new order to top
        state.orderHistory.unshift(action.payload);
      })

      .addCase(placeOrderAsync.rejected, (state, action) => {
        state.orderStatus = "failed";
        state.orderError = action.payload;
      })
      .addCase(fetchUserOrders.pending, (state) => {
        state.orderStatus = "loading";
      })

      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.orderStatus = "success";
        state.orderHistory = action.payload;
      })

      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.orderStatus = "failed";
        state.orderError = action.payload;
      });
  },
});

export const selectShippingDetails = (state) => state.checkout.shippingDetails;
export const selectShippingMethod = (state) => state.checkout.shippingMethod;
export const selectPaymentMethod = (state) => state.checkout.paymentMethod;
export const selectCardDetails = (state) => state.checkout.cardDetails;
export const selectOrderStatus = (state) => state.checkout.orderStatus;
export const selectOrderSnapshot = (state) => state.checkout.orderSnapshot;
export const selectOrderHistory = (state) => state.checkout.orderHistory;
export const selectShippingCost = (state) =>
  state.checkout.shippingMethod === "express" ? 15 : 0;

export const { updateShippingField, setShippingMethod, resetCheckout } =
  checkoutSlice.actions;

export default checkoutSlice.reducer;
