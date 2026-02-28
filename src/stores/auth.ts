import { defineStore } from 'pinia'
import axios from 'axios'
import router from '@/router'

// Configure default axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// Flag to prevent multiple concurrent refresh attempts
let isRefreshing = false
let failedQueue: Array<{
    resolve: (value?: unknown) => void
    reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

axios.interceptors.request.use(config => {
    // Don't add Authorization header for token refresh requests —
    // an expired JWT in the header would cause Django's JWTAuthentication
    // to reject the request with 401 before the view processes the refresh token.
    if (config.url?.includes('token/refresh')) {
        return config
    }
    const token = localStorage.getItem('accessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Add response interceptor to handle auth errors with automatic token refresh
axios.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't try to refresh if this was already a refresh request
            if (originalRequest.url?.includes('token/refresh')) {
                const authStore = useAuthStore()
                authStore.logout()
                return Promise.reject(error)
            }

            if (isRefreshing) {
                // Queue the request while refresh is in progress
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return axios(originalRequest)
                }).catch((err) => {
                    return Promise.reject(err)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
                isRefreshing = false
                const authStore = useAuthStore()
                authStore.logout()
                return Promise.reject(error)
            }

            try {
                const response = await axios.post('/api/auth/token/refresh/', {
                    refresh: refreshToken,
                })
                const newAccessToken = response.data.access

                localStorage.setItem('accessToken', newAccessToken)
                const authStore = useAuthStore()
                authStore.accessToken = newAccessToken

                processQueue(null, newAccessToken)
                isRefreshing = false

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                return axios(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                isRefreshing = false
                const authStore = useAuthStore()
                authStore.logout()
                return Promise.reject(refreshError)
            }
        } else if (error.response?.status === 403) {
            // Permission denied — show message, do NOT logout
            const detail = error.response.data?.detail || '权限不足，无法执行此操作'
            alert(detail)
        }
        return Promise.reject(error)
    }
)

// --- Remember Me credential helpers ---
const SAVED_CREDENTIALS_KEY = 'savedCredentials'

function saveCredentials(username: string, password: string) {
    const data = JSON.stringify({ username, password })
    localStorage.setItem(SAVED_CREDENTIALS_KEY, btoa(data))
}

function loadCredentials(): { username: string; password: string } | null {
    const raw = localStorage.getItem(SAVED_CREDENTIALS_KEY)
    if (!raw) return null
    try {
        return JSON.parse(atob(raw))
    } catch {
        return null
    }
}

function clearCredentials() {
    localStorage.removeItem(SAVED_CREDENTIALS_KEY)
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as any,
        accessToken: localStorage.getItem('accessToken') || null,
        refreshToken: localStorage.getItem('refreshToken') || null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.accessToken,
    },
    actions: {
        async login(credentials: { username: string; password: string; rememberMe?: boolean }) {
            try {
                const response = await axios.post('/api/auth/login/', {
                    username: credentials.username,
                    password: credentials.password,
                })
                this.accessToken = response.data.access
                this.refreshToken = response.data.refresh

                localStorage.setItem('accessToken', this.accessToken as string)
                localStorage.setItem('refreshToken', this.refreshToken as string)

                // Handle remember me
                if (credentials.rememberMe) {
                    saveCredentials(credentials.username, credentials.password)
                } else {
                    clearCredentials()
                }

                await this.fetchUser()

                router.push('/')
                return true
            } catch (error) {
                console.error('Login failed', error)
                return false
            }
        },
        async register(userData: any) {
            try {
                await axios.post('/api/auth/register/', userData)
                return true
            } catch (error) {
                console.error('Registration failed', error)
                throw error
            }
        },
        async fetchUser() {
            if (!this.accessToken) return
            try {
                const response = await axios.get('/api/auth/me/', {
                    headers: { Authorization: `Bearer ${this.accessToken}` }
                })
                this.user = response.data
            } catch (error) {
                // Don't logout here — the 401 interceptor will handle token refresh
                throw error
            }
        },
        logout() {
            this.user = null
            this.accessToken = null
            this.refreshToken = null
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            router.push('/login')
        },
        async loginWithFeishu() {
            try {
                const response = await axios.get('/api/auth/feishu/login_url/')
                window.location.href = response.data.authorize_url
            } catch (error) {
                console.error('Failed to get Feishu login URL', error)
            }
        },
        async handleFeishuCallback(code: string) {
            try {
                const response = await axios.get(`/api/auth/feishu/callback/?code=${code}`)
                this.accessToken = response.data.access
                this.refreshToken = response.data.refresh

                localStorage.setItem('accessToken', this.accessToken as string)
                localStorage.setItem('refreshToken', this.refreshToken as string)

                await this.fetchUser()

                router.push('/')
                return true
            } catch (error) {
                console.error('Feishu login callback failed', error)
                router.push('/login')
                return false
            }
        },
        /**
         * Try auto-login using the existing refresh token.
         * Called from the login page and router guard to silently restore sessions.
         * Returns true if auto-login succeeded.
         */
        async tryAutoLogin(): Promise<boolean> {
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) return false

            try {
                const response = await axios.post('/api/auth/token/refresh/', {
                    refresh: refreshToken,
                })
                this.accessToken = response.data.access
                localStorage.setItem('accessToken', this.accessToken as string)

                await this.fetchUser()
                return true
            } catch {
                // Refresh token is also expired or invalid — clean up
                this.accessToken = null
                this.refreshToken = null
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                return false
            }
        },
        // --- Remember me helpers ---
        getSavedCredentials() {
            return loadCredentials()
        },
        clearSavedCredentials() {
            clearCredentials()
        },
    }
})
