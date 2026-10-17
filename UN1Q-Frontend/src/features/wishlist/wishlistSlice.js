import { createSlice } from "@reduxjs/toolkit";
import { loginUser, logout, registerUserAsync } from "../auth/authSlice";

const wishlistKey = (userId) => `wishlist_${userId}`;

const loadWishlist = (userId) => {
  if (!userId) return [];
  try {
    const data = localStorage.getItem(wishlistKey(userId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveWishlist = (userId, items) => {
  if (!userId) return;
  localStorage.setItem(wishlistKey(userId), JSON.stringify(items));
};

const getBootUserId = () => {
  try {
    const session = localStorage.getItem("session");
    return session ? JSON.parse(session)?.id : null;
  } catch {
    return null;
  }
};

const initialState = {
  wishlistItems: loadWishlist(getBootUserId()),
  userId: getBootUserId(),
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    toggleWishlist: (state, action) => {
      const { product, categoryId } = action.payload;

      const index = state.wishlistItems.findIndex((i) => i.id === product.id);

      if (index !== -1) {
        state.wishlistItems.splice(index, 1);
      } else {
        state.wishlistItems.push({
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          discount: product.discount,
          image: product.image,
          categoryId,
        });
      }

      saveWishlist(state.userId, state.wishlistItems);
    },

    removeFromWishlist: (state, action) => {
      // payload: id
      state.wishlistItems = state.wishlistItems.filter(
        (i) => i.id !== action.payload,
      );
      saveWishlist(state.userId, state.wishlistItems);
    },

    clearWishlist: (state) => {
      state.wishlistItems = [];
      saveWishlist(state.userId, []);
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(loginUser.fulfilled, (state, action) => {
        const userId = action.payload.id;
        state.userId = userId;
        state.wishlistItems = loadWishlist(userId);
      })
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        const userId = action.payload.id;
        state.userId = userId;
        state.wishlistItems = loadWishlist(userId);
      })

      .addCase(logout, (state) => {
        state.wishlistItems = [];
        state.userId = null;
      });
  },
});

export const selectWishlistItems = (state) => state.wishlist.wishlistItems;
export const selectWishlistCount = (state) =>
  state.wishlist.wishlistItems.length;
export const selectIsWishlisted = (id) => (state) =>
  state.wishlist.wishlistItems.some((i) => i.id === id);

export const { toggleWishlist, removeFromWishlist, clearWishlist } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;
