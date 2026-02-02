'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  username?: string
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (email: string, password: string, username: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查本地存储中的登录状态
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        if (token && userData && userData !== 'undefined') {
          try {
            const parsedUserData = JSON.parse(userData)
            if (parsedUserData) {
              setUser(parsedUserData)
            } else {
              setUser(null)
            }
          } catch (parseError) {
            console.error('解析用户数据失败:', parseError)
            setUser(null)
          }
        } else {
          // 如果没有token或用户数据，确保状态为null
          setUser(null)
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
        // 清除可能损坏的存储
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    // 初始检查
    checkAuthStatus()

    // 监听本地存储变化
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token' || event.key === 'user') {
        checkAuthStatus()
      }
    }

    // 添加事件监听器
    window.addEventListener('storage', handleStorageChange)

    // 清理事件监听器
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // 调用后端登录接口
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.message || '登录失败')
      }

      const apiResponse = await response.json()
      
      // 检查响应数据是否完整（后端返回的格式是 {code, message, data: {token, user}}）
      if (apiResponse && apiResponse.data && apiResponse.data.token && apiResponse.data.user) {
        const { token, user } = apiResponse.data
        // 存储到本地存储
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // 存储到cookie，以便中间件读取
        document.cookie = `token=${token}; path=/; max-age=86400` // 24小时过期
        
        // 更新状态
        setUser(user)
      } else {
        throw new Error('登录响应数据不完整')
      }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 清除cookie
    document.cookie = 'token=; path=/; max-age=0'
    
    // 更新状态
    setUser(null)
  }

  const register = async (email: string, password: string, username: string) => {
    setIsLoading(true)
    try {
      // 调用后端注册接口
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData || '注册失败')
      }

      // 注册成功后自动登录
      await login(email, password)
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
    register
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
