import { Property, User, Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { 
  Plus,
  Home,
  MessageSquare,
  Eye,
  Edit,
  Heart,
  Search,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';

interface OverviewTabProps {
  user: User | null;
  stats: any;
  properties: Property[];
  savedProperties: Property[];
  inquiries: Booking[];
  onViewProperty: (id: string) => void;
  onEditProperty: (id: string) => void;
  formatPrice: (price: number) => string;
}

export default function OverviewTab({
  user,
  stats,
  properties,
  savedProperties,
  inquiries,
  onViewProperty,
  onEditProperty,
  formatPrice
}: OverviewTabProps) {
  const isLandlord = user?.role === 'landlord';
  const isTenant = user?.role === 'tenant';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user?.first_name || user?.name}!
        </h2>
        <p className="text-blue-100 mb-4">
          {isLandlord 
            ? `You have ${stats.totalProperties} properties and ${stats.pendingInquiries} pending inquiries.`
            : `You have ${stats.savedProperties} saved properties and ${stats.totalInquiries} total inquiries.`
          }
        </p>
        <div className="flex flex-wrap gap-3">
          {isLandlord ? (
            <>
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New Property
              </Button>
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-blue-600">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Inquiries
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search Properties
              </Button>
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-blue-600">
                <Heart className="h-4 w-4 mr-2" />
                Saved Properties
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Inquiries */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {isLandlord ? 'Recent Inquiries' : 'Your Recent Inquiries'}
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            {inquiries.length > 0 ? (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {inquiry.property?.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {isLandlord 
                          ? `From: ${inquiry.user?.first_name} ${inquiry.user?.last_name}`
                          : `To: ${inquiry.property?.address}, ${inquiry.property?.city}`
                        }
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(inquiry.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewProperty(inquiry.property?.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {isLandlord ? 'No inquiries yet' : 'You haven\'t sent any inquiries yet'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Performance Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isLandlord ? 'Property Performance' : 'Activity Summary'}
            </h3>
            
            {isLandlord ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Properties</span>
                  <span className="font-medium">{stats.activeProperties}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Revenue</span>
                  <span className="font-medium text-green-600">{formatPrice(stats.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="font-medium">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Response Time</span>
                  <span className="font-medium">2.3 hours</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Saved Properties</span>
                  <span className="font-medium">{stats.savedProperties}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Inquiries Sent</span>
                  <span className="font-medium">{stats.totalInquiries}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="font-medium">72%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Response Time</span>
                  <span className="font-medium">4.2 hours</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {isLandlord ? (
                <>
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Property
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Review Inquiries
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="h-4 w-4 mr-2" />
                    Manage Properties
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="h-4 w-4 mr-2" />
                    Search Properties
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="h-4 w-4 mr-2" />
                    View Saved
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    My Inquiries
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Properties/Saved Properties Grid */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isLandlord ? 'Your Properties' : 'Saved Properties'}
          </h3>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        {isLandlord ? (
          properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="relative">
                  <PropertyCard 
                    property={property as any}
                  />
                  <div className="absolute top-3 right-3 flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white shadow-sm"
                      onClick={() => onViewProperty(property.id)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white shadow-sm"
                      onClick={() => onEditProperty(property.id)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h4>
              <p className="text-gray-500 mb-6">Start by adding your first property listing</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            </div>
          )
        ) : (
          savedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property as any}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No saved properties</h4>
              <p className="text-gray-500 mb-6">Start browsing and save properties you like</p>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Browse Properties
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
