import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 不需要权限校验的路径
const publicPaths = [
  '/',
  '/help',
  '/about',
  '/login',
  '/register',
  '/forgot-password'
]

// 中间件函数
export function middleware(request: NextRequest) {
  // 获取当前路径
  const pathname = request.nextUrl.pathname
  
  // 检查是否是不需要权限校验的路径
  const isPublicPath = publicPaths.some(path => {
    // 对于根路径，直接匹配
    if (path === '/') {
      return pathname === '/'
    }
    // 对于其他路径，检查是否以该路径开头
    return pathname.startsWith(path)
  })
  
  // 如果是公开路径，直接放行
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // 检查是否有token
  const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '')
  
  // 如果没有token，重定向到登录页面
  if (!token) {
    const loginUrl = new URL('/login', request.nextUrl.origin)
    // 保存原始请求的路径，以便登录后重定向回来
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 如果有token，放行
  return NextResponse.next()
}

// 配置中间件的匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
