// src/app/features/user/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../../api"; // Axios yapılandırmanızı kullanın
import { logInfo } from "../../../utils/logger";

// Kullanıcı giriş yapma thunk'ı
export const loginUser = createAsyncThunk(
  "user/loginUser",
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await axios.post(
        "/auth/login",
        { email, password },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Giriş başarısız.");
    }
  }
);

// Kullanıcı çıkış yapma thunk'ı
export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async (_, thunkAPI) => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
      return true;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Çıkış yapılamadı.");
    }
  }
);

// Kullanıcı bilgisi getirme thunk'ı
export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (_, thunkAPI) => {
    try {
      // Token doğrulama
      const tokenResponse = await axios.post(
        "/auth/verify-token",
        {},
        { withCredentials: true }
      );

      if (!tokenResponse.data.success) {
        throw new Error("Token geçersiz.");
      }

      const userData = tokenResponse.data.data;
      if (!userData || !userData.user) {
        throw new Error("Kullanıcı bilgisi bulunamadı.");
      }

      // Eğer kullanıcı ID'si varsa, güncel bilgileri getir
      if (userData.user.id || userData.user._id) {
        const userId = userData.user.id || userData.user._id;

        try {
          const userResponse = await axios.get(`/user/${userId}`, {
            withCredentials: true,
          });
          if (userResponse.data.success && userResponse.data.data) {
            return { valid: true, user: userResponse.data.data };
          }
        } catch (userError) {
          // Hata durumunda token'dan gelen bilgileri kullan
        }
      }

      return { valid: true, user: userData.user };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Kullanıcı bilgileri alınamadı."
      );
    }
  }
);

// user register thunk
export const registerUser = createAsyncThunk(
  "user/registerUser",
  async ({ userName, email, password }, thunkAPI) => {
    try {
      const response = await axios.post(
        "/auth/register",
        { userName, email, password },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Registration failed.");
    }
  }
);

// Kullanıcı profili güncelleme thunk'ı
export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async ({ userId, userData }, thunkAPI) => {
    try {
      const response = await axios.put(`/user/${userId}`, userData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Profil güncellenemedi."
      );
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: null,
    isLoggedIn: false,
    isAdmin: false,
    isLoading: false,
    isSuccess: false,
    isError: false,
    errorMessage: "",
  },
  reducers: {
    clearState: (state) => {
      // Sadece başarı veya hata durumunda log yazalım, her render'da değil
      if (state.isSuccess || state.isError) {
        logInfo(
          "🧹 State",
          "Geçici durumlar temizleniyor (kullanıcı bilgileri korunuyor)"
        );
      }
      // Sadece geçici durumları temizle, kullanıcı bilgilerini koru
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = "";
      // userInfo, isLoggedIn ve isAdmin değerlerini koruyoruz
    },
    // Tam temizleme için yeni bir reducer ekleyelim (logout için)
    clearUserState: (state) => {
      logInfo("🧹 State", "Kullanıcı state tamamen temizleniyor");
      state.userInfo = null;
      state.isLoggedIn = false;
      state.isAdmin = false;
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // loginUser
      .addCase(loginUser.pending, (state) => {
        logInfo("🔄 Giriş", "Giriş işlemi başlatıldı");
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        // API yanıtı: {success, message, data: {user}}
        if (action.payload.success && action.payload.data?.user) {
          const user = action.payload.data.user;
          const userName = user.userName || user.email || "Kullanıcı";

          logInfo("✅ Giriş", `${userName} kullanıcısı giriş yaptı`);

          state.userInfo = user;
          state.isAdmin = user.role === "admin";
          state.isLoggedIn = true;
        } else {
          logInfo("⚠️ Giriş", "Giriş başarılı ancak kullanıcı bilgisi eksik");
          state.isLoggedIn = false;
        }

        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        logInfo("❌ Giriş", `Giriş başarısız: ${action.payload}`);
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Giriş başarısız.";
      })
      // register
      .addCase(registerUser.pending, (state) => {
        logInfo("🔄 Kayıt", "Kayıt işlemi başlatıldı");
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        // API yanıtı: {success, message, data: {user}}
        if (action.payload.success && action.payload.data?.user) {
          const user = action.payload.data.user;
          const userName = user.userName || user.email || "Kullanıcı";

          logInfo("✅ Kayıt", `${userName} kullanıcısı kaydedildi`);

          state.userInfo = user;
          state.isAdmin = user.role === "admin";
          state.isLoggedIn = true;
        } else {
          logInfo("⚠️ Kayıt", "Kayıt başarılı ancak kullanıcı bilgisi eksik");
          state.isLoggedIn = false;
        }

        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        logInfo("❌ Kayıt", `Kayıt başarısız: ${action.payload}`);
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Registration failed.";
      })
      // logoutUser
      .addCase(logoutUser.pending, (state) => {
        logInfo("🔄 Çıkış", "Çıkış işlemi başlatıldı");
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        logInfo("✅ Çıkış", "Kullanıcı çıkış yaptı");
        state.isLoading = false;
        state.isSuccess = true;
        state.userInfo = null;
        state.isLoggedIn = false;
        state.isAdmin = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        logInfo("❌ Çıkış", `Çıkış başarısız: ${action.payload}`);
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Çıkış yapılamadı.";
      })
      // fetchUser
      .addCase(fetchUser.pending, (state) => {
        logInfo("🔄 Kullanıcı", "Kullanıcı bilgisi getiriliyor");
        state.isLoading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        // fetchUser özel bir durum, kendi yapısı var
        const isValid = action.payload.valid !== false;

        if (isValid && action.payload.user) {
          const user = action.payload.user;
          const userName = user.userName || user.email || "Kullanıcı";

          logInfo("✅ Kullanıcı", `${userName} bilgisi alındı`);

          state.userInfo = user;
          state.isAdmin = user.role === "admin";
          state.isLoggedIn = true;
        } else {
          logInfo("✅ Kullanıcı", "Kullanıcı bilgisi alındı (oturum yok)");
          state.isLoggedIn = false;
          state.isAdmin = false;
        }

        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        logInfo(
          "❌ Kullanıcı",
          `Kullanıcı bilgisi alınamadı: ${action.payload}`
        );
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Kullanıcı bilgileri alınamadı.";
      })
      // updateUserProfile
      .addCase(updateUserProfile.pending, (state) => {
        logInfo("🔄 Profil", "Profil güncelleme başlatıldı");
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        // API yanıtı: {success, message, data}
        if (action.payload.success && action.payload.data) {
          const user = action.payload.data;
          const userName = user.userName || user.email || "Kullanıcı";

          logInfo("✅ Profil", `${userName} profili güncellendi`);
          state.userInfo = user;
        } else {
          logInfo("⚠️ Profil", "Profil güncelleme başarılı ancak veri eksik");
        }

        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        logInfo("❌ Profil", `Profil güncelleme başarısız: ${action.payload}`);
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Profil güncellenemedi.";
      });
  },
});

export const { clearState, clearUserState } = userSlice.actions;
export default userSlice.reducer;
