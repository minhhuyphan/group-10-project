import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAccessToken, setRefreshToken, clearTokens } from '../api';

// ===== ASYNC THUNKS =====

/**
 * loginThunk - Đăng nhập và lưu token + user vào Redux state
 */
export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, token: legacyToken, user } = res.data || {};
      
      // Hỗ trợ cả access/refresh token và legacy token
      const finalAccessToken = accessToken || legacyToken;
      
      if (finalAccessToken) {
        setAccessToken(finalAccessToken);
      }
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      
      return {
        accessToken: finalAccessToken,
        refreshToken: refreshToken || null,
        user: user || null,
      };
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * signupThunk - Đăng ký tài khoản mới
 */
export const signupThunk = createAsyncThunk(
  'auth/signup',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      return res.data;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Signup failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * logoutThunk - Đăng xuất và xóa token
 */
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const { auth } = getState();
      // Best-effort logout call
      await api.post('/auth/logout', { refreshToken: auth.refreshToken });
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearTokens();
    }
  }
);

/**
 * refreshUserThunk - Lấy thông tin user từ /profile
 */
export const refreshUserThunk = createAsyncThunk(
  'auth/refreshUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/profile');
      return res.data.user;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to refresh user';
      return rejectWithValue(message);
    }
  }
);

// ===== INITIAL STATE =====

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initializing: false, // Dùng để load user khi app khởi động
};

// ===== SLICE =====

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action để set user trực tiếp (nếu cần)
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    // Action để clear error
    clearError: (state) => {
      state.error = null;
    },
    // Action để set initializing
    setInitializing: (state, action) => {
      state.initializing = action.payload;
    },
    // Action để restore auth từ localStorage khi app khởi động
    restoreAuth: (state, action) => {
      const { accessToken, refreshToken, user } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      state.isAuthenticated = !!accessToken;
    },
  },
  extraReducers: (builder) => {
    // LOGIN
    builder.addCase(loginThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    });

    // SIGNUP
    builder.addCase(signupThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(signupThunk.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
      // Không auto-login sau signup
    });
    builder.addCase(signupThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // LOGOUT
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    });

    // REFRESH USER
    builder.addCase(refreshUserThunk.pending, (state) => {
      state.initializing = true;
    });
    builder.addCase(refreshUserThunk.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.initializing = false;
    });
    builder.addCase(refreshUserThunk.rejected, (state) => {
      state.initializing = false;
      // Không clear auth vì có thể token vẫn valid
    });
  },
});

export const { setUser, clearError, setInitializing, restoreAuth } = authSlice.actions;

export default authSlice.reducer;
