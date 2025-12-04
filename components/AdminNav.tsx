'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminNavProps {
  currentPage?: 'dashboard' | 'results' | 'players'
}

export default function AdminNav({ currentPage }: AdminNavProps) {
  const pathname = usePathname()

  const isActive = (page: string) => {
    if (page === 'dashboard') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(`/admin/${page}`)
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', key: 'dashboard' },
    { href: '/admin/results', label: 'Results Entry', key: 'results' },
    { href: '/admin/players', label: 'Player Management', key: 'players' },
  ]

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Admin Panel
              </span>
              <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                ADMIN
              </span>
            </div>

            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.key)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              View Site
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden pb-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.key)
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
