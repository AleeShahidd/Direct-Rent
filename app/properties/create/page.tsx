import { Metadata } from 'next';
import PropertyCreateForm from '@/components/property/PropertyCreateForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Create Property Listing | Direct-Rent',
  description: 'Create a new property listing on Direct-Rent. Add details, upload images, and publish your rental property.',
};

// Server component to check authentication
async function CreatePropertyPage() {
  const supabase = createClient();
  
  // Check if the user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  // If not authenticated, redirect to login
  if (!session) {
    redirect('/auth/login?redirect=/properties/create');
  }
  
  // Check if the user is a landlord
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  // If the user is not a landlord, redirect to role selection
  if (!profile || profile.role !== 'landlord') {
    redirect('/auth/select-role?redirect=/properties/create');
  }
  
  return <PropertyCreateForm />;
}

export default CreatePropertyPage;
