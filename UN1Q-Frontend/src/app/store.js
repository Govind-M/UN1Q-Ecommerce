import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import uiReducer from "../features/ui/uiSlice";
import productReducer from "../features/products/productsSlice";
import cartReducer from "../features/cart/cartSlice";
import wishlistReducer from "../features/wishlist/wishlistSlice";
import checkoutReducer from "../features/checkout/checkoutSlice";
import adminReducer from "../features/admin/adminSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    products: productReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    checkout: checkoutReducer,
    admin: adminReducer,
  },
});
