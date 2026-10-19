import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import {
  getUsersWithUserRole,
  getAllOrders,
  getAllProducts,
  addProduct,
  updateProduct,
  blockUser,
  patchOrderStatus,
  removeOrder,
  toggleProductStatus,
} from "../../services/api";



export const fetchUsersByAdmin = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getUsersWithUserRole();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getAllOrders();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchAllAdminProducts = createAsyncThunk(
  "admin/fetchAllProducts",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getAllProducts();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const addAdminProduct = createAsyncThunk(
  "admin/addProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const data = await addProduct(productData.categoryId, productData);
      return {
        ...data,
        category: productData.category,
        categoryId: productData.categoryId,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateAdminProduct = createAsyncThunk(
  "admin/updateProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const data = await updateProduct(
        productData.categoryId,
        productData.id,
        productData,
      );
      return {
        ...data,
        category: productData.category,
        categoryId: productData.categoryId,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const toggleUserBlock = createAsyncThunk(
  "admin/toggleUserBlock",
  async ({ id, isBlocked }, { rejectWithValue }) => {
    try {
      const data = await blockUser(id, !isBlocked);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  "admin/updateOrderStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const data = await patchOrderStatus(id, status);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deleteOrder = createAsyncThunk(
  "admin/deleteOrder",
  async (id, { rejectWithValue }) => {
    try {
      await removeOrder(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateProductStatus = createAsyncThunk(
  "admin/updateProductStatus",
  async ({ id, categoryId, status }, { rejectWithValue }) => {
    try {
      const data = await toggleProductStatus(categoryId, id, status);
      return {
        ...data,
        categoryId,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const initialState = {
  users: [],
  usersStatus: "idle",

  orders: [],
  ordersStatus: "idle",

  products: [],
  productsStatus: "idle",

  productModal: {
    open: false,
    mode: "add",
    product: null,
  },

  orderSearchQuery: "",
  productSearchQuery: "",
  userSearchQuery: "",
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },

    openAddProductModal(state) {
      state.productModal = {
        open: true,
        mode: "add",
        product: null,
      };
    },

    openEditProductModal(state, action) {
      state.productModal = {
        open: true,
        mode: "edit",
        product: action.payload,
      };
    },

    closeProductModal(state) {
      state.productModal = {
        open: false,
        mode: "add",
        product: null,
      };
    },

    setOrderSearch(state, action) {
      state.orderSearchQuery = action.payload;
    },

    setProductSearch(state, action) {
      state.productSearchQuery = action.payload;
    },

    setUserSearch(state, action) {
      state.userSearchQuery = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchUsersByAdmin.pending, (state) => {
        state.usersStatus = "loading";
      })
      .addCase(fetchUsersByAdmin.fulfilled, (state, action) => {
        state.usersStatus = "succeeded";
        state.users = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.results ?? [];
      })
      .addCase(fetchUsersByAdmin.rejected, (state) => {
        state.usersStatus = "failed";
      })

      .addCase(fetchAdminOrders.pending, (state) => {
        state.ordersStatus = "loading";
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.ordersStatus = "succeeded";
        state.orders = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.results ?? [];
      })
      .addCase(fetchAdminOrders.rejected, (state) => {
        state.ordersStatus = "failed";
      })
      .addCase(fetchAllAdminProducts.pending, (state) => {
        state.productsStatus = "loading";
      })
      .addCase(fetchAllAdminProducts.fulfilled, (state, action) => {
        state.productsStatus = "succeeded";
        state.products = action.payload.map((p) => ({
          ...p,
          status: p.status ?? "active",
        }));
      })
      .addCase(fetchAllAdminProducts.rejected, (state) => {
        state.productsStatus = "failed";
      })
      .addCase(addAdminProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
        state.productModal.open = false;
      })
      .addCase(updateAdminProduct.fulfilled, (state, action) => {
        const idx = state.products.findIndex(
          (p) =>
            p.id === action.payload.id &&
            p.categoryId === action.payload.categoryId,
        );
        if (idx !== -1) state.products[idx] = action.payload;
        state.productModal.open = false;
      })
      .addCase(toggleUserBlock.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.orders[idx] = action.payload;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter((o) => o.id !== action.payload);
      })
      .addCase(updateProductStatus.fulfilled, (state, action) => {
        const idx = state.products.findIndex(
          (p) =>
            p.id === action.payload.id &&
            p.categoryId === action.payload.categoryId,
        );

        if (idx !== -1) {
          state.products[idx].status = action.payload.status;
        }
      });
  },
});

export const selectUsersByAdmin = (state) =>
  Array.isArray(state.admin.users) ? state.admin.users : [];

export const selectAdminOrders = (state) =>
  Array.isArray(state.admin.orders) ? state.admin.orders : [];

export const selectAdminProducts = (state) => state.admin.products;
export const selectProductSearch = (state) => state.admin.productSearchQuery;
export const selectProductModal = (state) => state.admin.productModal;

export const selectUserSearch = (state) => state.admin.userSearchQuery;
export const selectOrderSearch = (state) => state.admin.orderSearchQuery;

export const selectOrdersChart = createSelector(
  (state) => state.admin.orders,
  (orders) => {
    const result = {};

    orders.forEach((order) => {
      const date = new Date(order.placedAt);
      const week = `W${Math.ceil(date.getDate() / 7)}`;

      if (!result[week]) {
        result[week] = { completed: 0, pending: 0 };
      }

      if (order.status === "Delivered" || order.status === "Fulfilled") {
        result[week].completed++;
      } else {
        result[week].pending++;
      }
    });

    return Object.entries(result).map(([week, val]) => ({
      week,
      ...val,
    }));
  },
);

export const selectEarningsChart = createSelector(
  (state) => state.admin.orders,
  (orders) => {
    const result = {};

    orders.forEach((order) => {
      const month = new Date(order.placedAt).toLocaleString("en", {
        month: "short",
      });

      if (!result[month]) result[month] = 0;
      result[month] += parseFloat(order.total || 0);
    });

    return Object.entries(result).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  },
);

export const selectUserOrderStats = createSelector(
  (state) => state.admin.orders,
  (_, userId) => userId,
  (orders, userId) => {
    const userOrders = orders?.filter((o) => o.userId === userId) || [];
    const totalContribution = userOrders.reduce(
      (s, o) => s + parseFloat(o.total || 0),
      0,
    );
    return {
      totalOrders: userOrders.length,
      totalContribution,
    };
  },
);

export const {
  openAddProductModal,
  openEditProductModal,
  closeProductModal,
  setOrderSearch,
  setProductSearch,
  setUserSearch,
} = adminSlice.actions;

export default adminSlice.reducer;
