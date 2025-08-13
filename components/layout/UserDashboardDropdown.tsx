import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  User,
  LogOut,
  HomeIcon,
  Settings,
  Heart,
  Mail,
  Bell,
  AlertTriangle,
  PieChart,
  Building,
  MessageSquare,
  Wrench,
  ShieldAlert
} from 'lucide-react'
import Image from 'next/image'
import { useML } from '@/contexts/MLContext'

export default function UserDashboardDropdown() {
  const { user, userProfile, signOut, loading } = useAuth()
  const { isMLHealthy } = useML()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (loading) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
    )
  }

  if (!user || !userProfile) {
    return (
      <div className="flex space-x-4">
        <Link href="/auth/login" className="text-gray-700 hover:text-primary-600 font-medium">
          Log in
        </Link>
        <Link
          href="/auth/register"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Sign up
        </Link>
      </div>
    )
  }

  const isAdmin = userProfile.role === 'admin'
  const isLandlord = userProfile.role === 'landlord'
  const isTenant = userProfile.role === 'tenant'
  
  // Get first letter of name for avatar fallback
  const nameInitial = (userProfile.first_name || userProfile.name || 'U').charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
    router.push('/')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
          {userProfile.avatar_url ? (
            <Image
              src={userProfile.avatar_url}
              alt={userProfile.name || 'User'}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <span>{nameInitial}</span>
          )}
          {isAdmin && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
          )}
          {isLandlord && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-blue-500 rounded-full border-2 border-white" />
          )}
          {isTenant && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
            {userProfile.first_name || userProfile.name}
          </div>
          <div className="text-xs text-gray-500">
            {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
          </div>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-semibold text-gray-900">{userProfile.name}</div>
            <div className="text-xs text-gray-500 truncate mt-0.5">{user.email}</div>
            <div className="mt-2 flex items-center">
              <span className={`h-2 w-2 rounded-full ${userProfile.verification_status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'} mr-2`}></span>
              <span className="text-xs text-gray-500">
                {userProfile.verification_status === 'verified' ? 'Verified Account' : 'Verification Pending'}
              </span>
            </div>
          </div>

          <div className="py-1">
            {/* Common Links */}
            <Link 
              href="/dashboard/unified" 
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <HomeIcon className="h-4 w-4 mr-3 text-gray-500" />
              Dashboard
            </Link>
            
            <Link 
              href="/dashboard/settings" 
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4 mr-3 text-gray-500" />
              Account Settings
            </Link>

            {/* Tenant specific links */}
            {isTenant && (
              <>
                <Link 
                  href="/dashboard/unified?tab=saved" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <Heart className="h-4 w-4 mr-3 text-gray-500" />
                  Saved Properties
                </Link>
                <Link 
                  href="/dashboard/unified?tab=inquiries" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <Mail className="h-4 w-4 mr-3 text-gray-500" />
                  My Inquiries
                </Link>
              </>
            )}

            {/* Landlord specific links */}
            {isLandlord && (
              <>
                <Link 
                  href="/dashboard/unified?tab=properties" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <Building className="h-4 w-4 mr-3 text-gray-500" />
                  My Properties
                </Link>
                <Link 
                  href="/dashboard/unified?tab=inquiries" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <MessageSquare className="h-4 w-4 mr-3 text-gray-500" />
                  Tenant Inquiries
                </Link>
                <Link 
                  href="/dashboard/unified?tab=analytics" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <PieChart className="h-4 w-4 mr-3 text-gray-500" />
                  Analytics
                </Link>
              </>
            )}

            {/* Admin specific links */}
            {isAdmin && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin Controls
                </div>
                <Link 
                  href="/dashboard/admin" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <Wrench className="h-4 w-4 mr-3 text-gray-500" />
                  Admin Dashboard
                </Link>
                <Link 
                  href="/dashboard/admin?tab=ml-monitoring" 
                  className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-3 text-gray-500" />
                    ML System Status
                  </div>
                  <div className={`h-2 w-2 rounded-full ${isMLHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </Link>
                <Link 
                  href="/dashboard/admin?tab=fraud" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldAlert className="h-4 w-4 mr-3 text-gray-500" />
                  Fraud Detection
                </Link>
              </>
            )}
          </div>

          <div className="border-t border-gray-100 mt-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 mr-3 text-gray-500" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
