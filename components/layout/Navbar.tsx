'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  HeartIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ClientOnly } from '@/components/ui/client-only'
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { UserIcon } from '@heroicons/react/24/solid'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, userProfile, signOut, loading } = useAuth()
  const router = useRouter()
  console.log('User:', user);
  console.log('User Profile:', userProfile);

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
    { name: 'How it Works', href: '/how-it-works', icon: null },
    { name: 'About', href: '/about', icon: null },
  ]

  const landlordNavigation = [
    { name: 'Dashboard', href: '/dashboard/unified', icon: ChartBarIcon },
    { name: 'My Properties', href: '/dashboard/unified?tab=properties', icon: BuildingOfficeIcon },
    { name: 'Add Property', href: '/properties/new', icon: PlusIcon },
    { name: 'Inquiries', href: '/dashboard/unified?tab=inquiries', icon: BellIcon },
  ]

  const tenantNavigation = [
    { name: 'Dashboard', href: '/dashboard/unified', icon: ChartBarIcon },
    { name: 'Saved Properties', href: '/dashboard/unified?tab=saved', icon: HeartIcon },
    { name: 'My Inquiries', href: '/dashboard/unified?tab=inquiries', icon: BellIcon },
  ]

  const userNavigation = user ? [
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
    { name: 'Dashboard', href: '/dashboard/unified', icon: ChartBarIcon },
    ...(userProfile?.role === 'admin' ? [{ name: 'Admin Panel', href: '/dashboard/admin', icon: ShieldCheckIcon }] : []),
  ] : []

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <Link href="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <HomeIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  DirectRent <span className="text-blue-600">UK</span>
                </span>
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-3">
            {/* Quick action buttons for authenticated users */}
            <ClientOnly fallback={<div className="hidden lg:flex items-center space-x-2 w-48 h-9" />}>
              {!loading && user && (
                <div className="hidden lg:flex items-center space-x-2">
                  {userProfile?.role === 'landlord' && (
                    <>
                      <Link href="/properties/new">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Property
                        </Button>
                      </Link>
                      <Link href="/dashboard/unified">
                        <Button variant="outline" size="sm">
                          <ChartBarIcon className="w-4 h-4 mr-1" />
                          Dashboard
                        </Button>
                      </Link>
                    </>
                  )}
                  {userProfile?.role === 'tenant' && (
                    <Link href="/dashboard/unified">
                      <Button variant="outline" size="sm">
                        <ChartBarIcon className="w-4 h-4 mr-1" />
                        Dashboard
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </ClientOnly>

            {/* User menu */}
            <ClientOnly 
              fallback={
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-9 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-9 bg-gray-200 rounded animate-pulse"></div>
                </div>
              }
            >
              {!loading ? (
                user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 px-3 hover:bg-gray-50">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-blue-600 text-white text-sm">
                          {user.user_metadata?.avatar_url ? user.email?.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-gray-700">
                          {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </div>
                        {userProfile?.role && (
                          <div className="text-xs text-blue-600 capitalize">{userProfile.role}</div>
                        )}
                      </div>
                      <ChevronDownIcon className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 text-sm border-b">
                      <div className="font-medium">{user.user_metadata?.full_name || 'User'}</div>
                      <div className="text-gray-500">{user.email}</div>
                      {userProfile?.role && (
                        <div className="text-xs text-blue-600 capitalize mt-1">{userProfile.role}</div>
                      )}
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Role-specific navigation */}
                    {userProfile?.role === 'landlord' && (
                      <>
                        {landlordNavigation.map((item) => (
                          <DropdownMenuItem key={item.name}>
                            <Link href={item.href} className="flex items-center space-x-2 w-full">
                              <item.icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {userProfile?.role === 'tenant' && (
                      <>
                        {tenantNavigation.map((item) => (
                          <DropdownMenuItem key={item.name}>
                            <Link href={item.href} className="flex items-center space-x-2 w-full">
                              <item.icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {/* Common user navigation */}
                    {userNavigation.map((item) => (
                      <DropdownMenuItem key={item.name}>
                        <Link href={item.href} className="flex items-center space-x-2 w-full">
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <div className="flex items-center space-x-2">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Sign out</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
                  </Link>
                </div>
              )
            ) : (
              // Loading state placeholder to prevent layout shift
              <div className="flex items-center space-x-2">
                <div className="w-20 h-9 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
            )}
            </ClientOnly>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <ClientOnly>
        {isOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {!loading && user && (
              <>
                <div className="border-t border-gray-200 pt-4">
                  <div className="px-3 py-2">
                    <div className="text-base font-medium text-gray-800">
                      {user.user_metadata?.full_name || 'User'}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {userProfile?.role && (
                      <div className="text-xs text-blue-600 capitalize mt-1">{userProfile.role}</div>
                    )}
                  </div>
                </div>
                
                {/* Role-specific mobile navigation */}
                {userProfile?.role === 'landlord' && (
                  <>
                    {landlordNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </>
                )}
                
                {userProfile?.role === 'tenant' && (
                  <>
                    {tenantNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </>
                )}
                
                {userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>
        )}
      </ClientOnly>
    </nav>
  )
}
