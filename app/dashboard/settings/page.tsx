'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { useUser } from '@/hooks/useUser'
import { User } from '@/types/enhanced'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    email: '',
    phone: '',
    email_notifications: true,
    sms_notifications: false,
    profile_visible: true,
  })

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login')
    }
    
    if (user) {
      fetchUserProfile()
    }
  }, [user, loading, router])

  const fetchUserProfile = async () => {
    try {
      if (!user?.id) return

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          preferences:user_preferences(*)
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setUserProfile(data)
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          full_name: data.name || data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          email_notifications: data.preferences?.email_notifications ?? true,
          sms_notifications: data.preferences?.sms_notifications ?? false,
          profile_visible: data.preferences?.profile_visible ?? true,
        })
        setAvatarUrl(data.avatar_url || '')
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message)
      setError('Failed to load profile information')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Update full name when first or last name changes
    if (name === 'first_name' || name === 'last_name') {
      const firstName = name === 'first_name' ? value : formData.first_name
      const lastName = name === 'last_name' ? value : formData.last_name
      setFormData(prev => ({
        ...prev,
        full_name: `${firstName} ${lastName}`.trim()
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          name: formData.full_name, // Use name field based on schema fix
          phone: formData.phone,
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update or insert user preferences
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingPrefs) {
        // Update existing preferences
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .update({
            email_notifications: formData.email_notifications,
            sms_notifications: formData.sms_notifications,
            profile_visible: formData.profile_visible,
          })
          .eq('user_id', user.id)

        if (prefsError) {
          throw prefsError
        }
      } else {
        // Insert new preferences
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            email_notifications: formData.email_notifications,
            sms_notifications: formData.sms_notifications,
            profile_visible: formData.profile_visible,
          })

        if (prefsError) {
          throw prefsError
        }
      }

      setSuccess('Settings updated successfully')
      fetchUserProfile() // Refresh data
    } catch (error: any) {
      console.error('Error updating profile:', error.message)
      setError(error.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-avatar.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      const avatarUrl = data.publicUrl

      // Update the user's avatar_url in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user?.id)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(avatarUrl)
      setSuccess('Avatar updated successfully')
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message)
      setError('Failed to update avatar')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p>Please sign in to access settings</p>
            <Button 
              onClick={() => router.push('/auth/login')}
              className="mt-4"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>
                      {formData.first_name.charAt(0)}{formData.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <Label htmlFor="avatar" className="block mb-2">Profile Photo</Label>
                    <Input 
                      id="avatar" 
                      type="file" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+44 7xxx xxx xxx"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <Input
                      id="role"
                      value={userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) || ''}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-500">
                    Receive email updates about your account activity
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  name="email_notifications"
                  checked={formData.email_notifications}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">SMS Notifications</h3>
                  <p className="text-sm text-gray-500">
                    Receive text messages for important updates
                  </p>
                </div>
                <Switch
                  id="sms_notifications"
                  name="sms_notifications"
                  checked={formData.sms_notifications}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, sms_notifications: checked }))
                  }
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Manage your privacy and visibility settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Profile Visibility</h3>
                  <p className="text-sm text-gray-500">
                    Allow other users to view your public profile
                  </p>
                </div>
                <Switch
                  id="profile_visible"
                  name="profile_visible"
                  checked={formData.profile_visible}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, profile_visible: checked }))
                  }
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Change Password</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Update your password to keep your account secure
                </p>
                <Button 
                  onClick={() => router.push('/auth/password-reset')}
                  variant="outline"
                >
                  Reset Password
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline" disabled>
                  Enable 2FA (Coming Soon)
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium text-red-600 mb-2">Delete Account</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Permanently delete your account and all associated data
                </p>
                <Button variant="destructive">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
