// src/app/features/blogs/postsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../../api"; // Kendi axios ayarlarınız
import { logInfo } from "../../../utils/logger";

/* =====================
   Yardımcı Fonksiyonlar
===================== */

// Pending durumunda ortak ayarlar
const handlePending = (state) => {
  state.isLoading = true;
  state.isError = false;
  state.errorMessage = "";
  state.errorCode = null;
};

// Rejected durumunda ortak ayarlar (defaultMessage: ilgili mesaj)
const handleRejected = (state, action, defaultMessage) => {
  state.isLoading = false;
  state.isError = true;
  state.errorMessage = action.payload?.message || defaultMessage;
  state.errorCode = action.payload?.code || "UNKNOWN_ERROR";
};

/* =====================
   Thunk İşlemleri
===================== */

export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async ({ page = 1, limit = 20 }, thunkAPI) => {
    try {
      const response = await axios.get("/posts", { params: { page, limit } });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Postları getirirken hata oluştu.",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

export const fetchPostById = createAsyncThunk(
  "posts/fetchPostById",
  async (postId, thunkAPI) => {
    try {
      const response = await axios.get(`/posts/one-post/${postId}`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Tekil post getirilirken hata oluştu.",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

export const upvotePost = createAsyncThunk(
  "posts/upvotePost",
  async (postId, thunkAPI) => {
    try {
      const response = await axios.put(`/posts/${postId}/upvote`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Upvote eklenirken hata oluştu.",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

export const downvotePost = createAsyncThunk(
  "posts/downvotePost",
  async (postId, thunkAPI) => {
    try {
      const response = await axios.put(`/posts/${postId}/downvote`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Downvote eklenirken hata oluştu.",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

export const fetchPostsByCategory = createAsyncThunk(
  "posts/fetchPostsByCategory",
  async (category, thunkAPI) => {
    try {
      const response = await axios.get(`/category/${category}`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Postları getirirken hata oluştu.",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

export const addNewPost = createAsyncThunk(
  "posts/addNewPost",
  async (postData, thunkAPI) => {
    try {
      const response = await axios.post("/posts", postData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Post eklerken hata oluştu.",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

export const updatePost = createAsyncThunk(
  "posts/updatePost",
  async ({ id, postData }, thunkAPI) => {
    try {
      const response = await axios.put(`/posts/${id}`, postData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Post güncellerken hata oluştu.",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (id, thunkAPI) => {
    try {
      const response = await axios.delete(`/posts/${id}`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Post silerken hata oluştu.",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

export const incrementPostView = createAsyncThunk(
  "posts/incrementPostView",
  async (postId, thunkAPI) => {
    try {
      const response = await axios.put(`/posts/${postId}/view`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Görüntülenme artırılırken hata oluştu.",
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

/* =====================
   Slice Tanımı
===================== */

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    posts: [],
    isLoading: false,
    isSuccess: false,
    isError: false,
    errorMessage: "",
    errorCode: null,
    pagination: { next: null, total: 0, count: 0 },
    count: 0,
    total: 0,
  },
  reducers: {
    clearState: (state) => {
      logInfo("🧹 State", "Post state temizleniyor");
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = "";
      state.errorCode = null;
    },
    removePost: (state, action) => {
      logInfo("🗑️ Post", `Post siliniyor: ${action.payload}`);
      state.posts = state.posts.filter((post) => post._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPosts
      .addCase(fetchPosts.pending, handlePending)
      .addCase(fetchPosts.fulfilled, (state, action) => {
        logInfo("✅ Postlar", "Postlar başarıyla getirildi");
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload && action.payload.data) {
          state.posts = action.payload.data.posts || [];
          state.pagination = action.payload.data.pagination || {
            next: null,
            total: 0,
            count: 0,
          };
          state.count = action.payload.data.count || 0;
          state.total = action.payload.data.total || 0;
          logInfo(
            "✅ Postlar",
            `${state.posts.length} post başarıyla getirildi`
          );
        } else {
          state.posts = [];
          state.pagination = { next: null, total: 0, count: 0 };
          state.count = 0;
          state.total = 0;
          logInfo(
            "⚠️ Postlar",
            "API yanıtı beklenen formatta değil, boş dizi kullanılıyor"
          );
        }
      })
      .addCase(fetchPosts.rejected, (state, action) =>
        handleRejected(state, action, "Postları getirirken hata oluştu.")
      )

      // fetchPostById
      .addCase(fetchPostById.fulfilled, (state, action) => {
        if (!action.payload) {
          logInfo("❌ Post", "Post verisi bulunamadı");
          return;
        }
        const fetchedPost = action.payload;
        const index = state.posts.findIndex((p) => p._id === fetchedPost._id);
        if (index !== -1) {
          logInfo(
            "✅ Post",
            `Post güncellendi: ${fetchedPost.title || fetchedPost._id}`
          );
          state.posts[index] = fetchedPost;
        } else {
          logInfo(
            "✅ Post",
            `Yeni post eklendi: ${fetchedPost.title || fetchedPost._id}`
          );
          state.posts.push(fetchedPost);
        }
      })
      .addCase(fetchPostById.rejected, (state, action) =>
        handleRejected(state, action, "Tekil post getirilirken hata oluştu.")
      )

      // upvotePost
      .addCase(upvotePost.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        const index = state.posts.findIndex(
          (post) => post._id === updatedPost._id
        );
        if (index !== -1) {
          logInfo(
            "👍 Upvote",
            `Post upvote edildi: ${updatedPost.title || updatedPost._id}`
          );
          state.posts[index] = updatedPost;
        }
      })
      .addCase(upvotePost.rejected, (state, action) =>
        handleRejected(state, action, "Upvote eklenirken hata oluştu.")
      )

      // downvotePost
      .addCase(downvotePost.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        const index = state.posts.findIndex(
          (post) => post._id === updatedPost._id
        );
        if (index !== -1) {
          logInfo(
            "👎 Downvote",
            `Post downvote edildi: ${updatedPost.title || updatedPost._id}`
          );
          state.posts[index] = updatedPost;
        }
      })
      .addCase(downvotePost.rejected, (state, action) =>
        handleRejected(state, action, "Downvote eklenirken hata oluştu.")
      )

      // fetchPostsByCategory
      .addCase(fetchPostsByCategory.pending, handlePending)
      .addCase(fetchPostsByCategory.fulfilled, (state, action) => {
        logInfo(
          "✅ Kategori",
          `${action.payload?.length || 0} post kategoriye göre getirildi`
        );
        state.isLoading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPostsByCategory.rejected, (state, action) =>
        handleRejected(state, action, "Postları getirirken hata oluştu.")
      )

      // addNewPost
      .addCase(addNewPost.pending, handlePending)
      .addCase(addNewPost.fulfilled, (state, action) => {
        const newPost = action.payload.post || action.payload;
        logInfo(
          "✅ Yeni Post",
          `Post eklendi: ${newPost.title || newPost._id}`
        );
        state.isLoading = false;
        state.isSuccess = true;
        state.posts.unshift(newPost);
      })
      .addCase(addNewPost.rejected, (state, action) =>
        handleRejected(state, action, "Post eklerken hata oluştu.")
      )

      // updatePost
      .addCase(updatePost.pending, handlePending)
      .addCase(updatePost.fulfilled, (state, action) => {
        const updatedPost = action.payload.post || action.payload;
        logInfo(
          "✅ Post Güncelleme",
          `Post güncellendi: ${updatedPost.title || updatedPost._id}`
        );
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.posts.findIndex(
          (post) => post._id === updatedPost._id
        );
        if (index !== -1) {
          state.posts[index] = updatedPost;
        }
      })
      .addCase(updatePost.rejected, (state, action) =>
        handleRejected(state, action, "Post güncellerken hata oluştu.")
      )

      // deletePost
      .addCase(deletePost.pending, handlePending)
      .addCase(deletePost.fulfilled, (state, action) => {
        logInfo("✅ Post Silme", `Post silindi: ${action.payload}`);
        state.isLoading = false;
        state.isSuccess = true;
        state.posts = state.posts.filter((post) => post._id !== action.payload);
      })
      .addCase(deletePost.rejected, (state, action) =>
        handleRejected(state, action, "Post silerken hata oluştu.")
      )

      // incrementPostView
      .addCase(incrementPostView.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        const index = state.posts.findIndex((p) => p._id === updatedPost._id);
        if (index !== -1) {
          logInfo(
            "👁️ Görüntülenme",
            `Post görüntülendi: ${updatedPost.title || updatedPost._id}`
          );
          state.posts[index] = updatedPost;
        }
      })
      .addCase(incrementPostView.rejected, (state, action) =>
        handleRejected(state, action, "Görüntülenme artırılırken hata oluştu.")
      );
  },
});

export const { clearState, removePost } = postsSlice.actions;
export default postsSlice.reducer;
