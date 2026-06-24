import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ─── Request: attach access token ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response: handle 401 + token refresh ─────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(api(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefresh } = data.data
        useAuthStore.getState().setTokens(accessToken, newRefresh)
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        useAuthStore.getState().logout()
        toast.error('Session expired. Please log in again.')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // Show error toast for non-auth errors
    const message = error.response?.data?.message
    if (error.response?.status >= 500) {
      toast.error(message || 'Server error. Please try again.')
    }

    return Promise.reject(error)
  }
)

export default api

// ─── Typed API helpers ─────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; department?: string; title?: string }) => api.post('/auth/register', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken?: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: object) => api.put('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) => api.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
}

export const jobsApi = {
  list: (params?: object) => api.get('/jobs', { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  create: (data: object) => api.post('/jobs', data),
  update: (id: string, data: object) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  rank: (id: string) => api.post(`/jobs/${id}/rank`),
  departments: () => api.get('/jobs/meta/departments'),
}

export const candidatesApi = {
  list: (params?: object) => api.get('/candidates', { params }),
  get: (id: string) => api.get(`/candidates/${id}`),
  update: (id: string, data: object) => api.put(`/candidates/${id}`, data),
  delete: (id: string) => api.delete(`/candidates/${id}`),
  shortlist: (id: string) => api.put(`/candidates/${id}/shortlist`),
  rescore: (id: string) => api.post(`/candidates/${id}/rescore`),
  report: (id: string) => api.get(`/candidates/${id}/report`),
}

export const resumesApi = {
  upload: (files: File[], jobId: string, onProgress?: (pct: number) => void) => {
    const form = new FormData()
    files.forEach((f) => form.append('resumes', f))
    form.append('jobId', jobId)
    return api.post('/resumes/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    })
  },
  list: (params?: object) => api.get('/resumes', { params }),
  get: (id: string) => api.get(`/resumes/${id}`),
  delete: (id: string) => api.delete(`/resumes/${id}`),
  reparse: (id: string) => api.post(`/resumes/${id}/reparse`),
}

export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  funnel: (jobId?: string) => api.get('/analytics/funnel', { params: jobId ? { jobId } : {} }),
  skills: () => api.get('/analytics/skills'),
  scoreDistribution: () => api.get('/analytics/score-distribution'),
  departments: () => api.get('/analytics/departments'),
  recentActivity: () => api.get('/analytics/recent-activity'),
}

export const adminApi = {
  recruiters: (params?: object) => api.get('/admin/recruiters', { params }),
  getRecruiter: (id: string) => api.get(`/admin/recruiters/${id}`),
  createRecruiter: (data: object) => api.post('/admin/recruiters', data),
  updateRecruiter: (id: string, data: object) => api.put(`/admin/recruiters/${id}`, data),
  deleteRecruiter: (id: string) => api.delete(`/admin/recruiters/${id}`),
  platformStats: () => api.get('/admin/platform-stats'),
}
