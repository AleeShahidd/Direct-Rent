import React from 'react';
import { Metadata } from 'next';
import PropertySearchPage from '@/components/search/PropertySearchPage';

export const metadata: Metadata = {
  title: 'Properties | Direct-Rent',
  description: 'Browse available rental properties across the UK. Find your next home with Direct-Rent.',
};

export default function PropertiesPage() {
  return <PropertySearchPage />;
}
