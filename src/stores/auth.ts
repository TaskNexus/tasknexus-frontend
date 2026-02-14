import { defineStore } from 'pinia'
import axios from 'axios'
import router from '@/router'

// Configure default axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

axios.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Token expired or invalid
            const authStore = useAuthStore()
            authStore.logout()
        }
        return Promise.reject(error)
    }
)

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
        async login(credentials: any) {
            try {
                const response = await axios.post('/api/auth/login/', credentials)
                this.accessToken = response.data.access
                this.refreshToken = response.data.refresh

                localStorage.setItem('accessToken', this.accessToken as string)
                localStorage.setItem('refreshToken', this.refreshToken as string)

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
                this.logout()
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
        }
    }
})
