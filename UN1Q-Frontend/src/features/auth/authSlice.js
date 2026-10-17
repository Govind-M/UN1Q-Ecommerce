import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUserApi,
  updateUserProfile,
} from "../../services/api";

export const registerUserAsync = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const createdUser = await registerUser(userData);
      return createdUser;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.message ||
        "Registration failed. Please try again.";
      return rejectWithValue(message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ userId, updates }, { rejectWithValue }) => {
    try {
      const data = await updateUserProfile(userId, updates);
      localStorage.setItem("session", JSON.stringify(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await loginUserApi({ email, password });
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("session", JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      const responseData = error.response?.data;
      if (responseData?.non_field_errors) {
        const firstError = responseData.non_field_errors[0];
        if (firstError?.code === "ACCOUNT_BLOCKED") {
          return rejectWithValue("BLOCKED_USER");
        }
        if (
          typeof firstError === "string" &&
          firstError.toLowerCase().includes("blocked")
        ) {
          return rejectWithValue("BLOCKED_USER");
        }
      }
      const message =
        responseData?.detail ||
        responseData?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      return rejectWithValue(message);
    }
  },
);

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("session");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialState = {
  isLoading: false,
  user: getStoredUser(),
  error: null,
  success: false,
  blockedWhileLoggedIn: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthStatus: (state) => {
      state.error = null;
      state.success = false;
    },
    logout: (state) => {
      state.user = null;
      state.error = null;
      state.success = false;
      localStorage.removeItem("session");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("cart");
      localStorage.removeItem("wishlist");
    },
    forceLogoutBlocked: (state) => {
      state.user = null;
      state.error = null;
      state.success = false;
      state.blockedWhileLoggedIn = true;
      localStorage.removeItem("session");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("cart");
      localStorage.removeItem("wishlist"); 
  }},
  extraReducers: (builder) => {
    builder
      .addCase(registerUserAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.success = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, resetAuthStatus, forceLogoutBlocked } = authSlice.actions;
export default authSlice.reducer;
