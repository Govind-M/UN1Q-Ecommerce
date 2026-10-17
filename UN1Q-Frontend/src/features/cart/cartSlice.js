import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser, logout, registerUserAsync } from "../auth/authSlice";
import { validateCouponApi } from "../../services/api";

const cartKey = (userId) => `cart_${userId}`;

const loadCart = (userId) => {
  if (!userId) return [];
  try {
    const data = localStorage.getItem(cartKey(userId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveCart = (userId, cartItems) => {
  if (!userId) return;
  localStorage.setItem(cartKey(userId), JSON.stringify(cartItems));
};

const getBootUserId = () => {
  try {
    const session = localStorage.getItem("session");
    return session ? JSON.parse(session)?.id : null;
  } catch {
    return null;
  }
};


export const validateCouponAsync = createAsyncThunk(
  "cart/validateCoupon",
  async (code, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const subtotal = selectCartTotal(state);
      const data = await validateCouponApi(code, subtotal);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const initialState = {
  cartItems: loadCart(getBootUserId()),
  userId: getBootUserId(),
  appliedCoupon: null, 
  couponError: null,
  couponStatus: "idle", 
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, categoryId, selectedSize, qty = 1 } = action.payload;

      const existingItem = state.cartItems.find(
        (i) => i.id === product.id && i.selectedSize === selectedSize,
      );

      if (existingItem) {
        existingItem.quantity += qty;
      } else {
        state.cartItems.push({
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          discount: product.discount,
          image: product.image,
          categoryId,
          selectedSize,
          quantity: qty,
        });
      }

      saveCart(state.userId, state.cartItems);
    },
    removeFromCart: (state, action) => {
      const { id, selectedSize } = action.payload;
      state.cartItems = state.cartItems.filter(
        (i) => !(i.id === id && i.selectedSize === selectedSize),
      );

      saveCart(state.userId, state.cartItems);
    },
    increaseQuantity: (state, action) => {
      const { id, selectedSize } = action.payload;
      const exisitingItem = state.cartItems.find(
        (i) => i.id === id && i.selectedSize === selectedSize,
      );
      if (exisitingItem) {
        exisitingItem.quantity += 1;
      }
      saveCart(state.userId, state.cartItems);
    },
    decreaseQuantity: (state, action) => {
      const { id, selectedSize } = action.payload;
      const exisitingItem = state.cartItems.find(
        (i) => i.id === id && i.selectedSize === selectedSize,
      );
      if (exisitingItem && exisitingItem.quantity > 1) {
        exisitingItem.quantity -= 1;
      } else {
        state.cartItems = state.cartItems.filter(
          (i) => !(i.id === id && i.selectedSize === selectedSize),
        );
      }
      saveCart(state.userId, state.cartItems);
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.couponError = null;
      state.couponStatus = "idle";
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.appliedCoupon = null;
      state.couponError = null;
      state.couponStatus = "idle";
      saveCart(state.userId, []);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        const userId = action.payload.id;
        state.userId = userId;
        state.cartItems = loadCart(userId);
      })
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        const userId = action.payload.id;
        state.userId = userId;
        state.cartItems = loadCart(userId);
      })
      .addCase(logout, (state) => {
        state.cartItems = [];
        state.appliedCoupon = null;
        state.couponError = null;
        state.couponStatus = "idle";
        state.userId = null;
      })
      .addCase(validateCouponAsync.pending, (state) => {
        state.couponStatus = "loading";
        state.couponError = null;
      })
      .addCase(validateCouponAsync.fulfilled, (state, action) => {
        state.couponStatus = "succeeded";
        state.appliedCoupon = {
          code: action.payload.code,
          discountType: action.payload.discount_type,
          discountValue: parseFloat(action.payload.discount_value),
          discountAmount: parseFloat(action.payload.discount_amount),
        };
        state.couponError = null;
      })
      .addCase(validateCouponAsync.rejected, (state, action) => {
        state.couponStatus = "failed";
        state.couponError = action.payload || "Failed to validate coupon.";
        state.appliedCoupon = null;
      });
  },
});

export const selectCartItems = (state) => state.cart.cartItems;
export const selectCartCount = (state) =>
  state.cart.cartItems.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartTotal = (state) =>
  state.cart.cartItems.reduce((sum, i) => {
    const disc = parseInt(i.discount ?? "0", 10);
    const final = Math.round(i.price * (1 - disc / 100));
    return sum + final * i.quantity;
  }, 0);

export const selectAppliedCoupon = (state) => state.cart.appliedCoupon;
export const selectCouponError = (state) => state.cart.couponError;
export const selectCouponStatus = (state) => state.cart.couponStatus;

export const selectCouponDiscount = (state) => {
  const coupon = state.cart.appliedCoupon;
  if (!coupon) return 0;
  return coupon.discountAmount || 0;
};

export const selectIsInCart = (id, selectedSize) => (state) =>
  state.cart.cartItems.some(
    (i) => i.id === id && i.selectedSize === selectedSize,
  );

export const {
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  removeCoupon,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
