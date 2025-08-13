import { User, Property, Booking } from '@/types';
import { 
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface AnalyticsTabProps {
  user: User | null;
  stats: any;
  properties: Property[];
  inquiries: Booking[];
}

export default function AnalyticsTab({
  user,
  stats,
  properties,
  inquiries
}: AnalyticsTabProps) {
  const isLandlord = user?.role === 'landlord';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate analytics data
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const inquiryData = months.map(month => ({
      month,
      inquiries: Math.floor(Math.random() * 20) + 5
    }));
    
    const revenueData = months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 5000) + 2000
    }));

    return { inquiryData, revenueData };
  };

  const { inquiryData, revenueData } = getMonthlyData();

  const propertyTypeDistribution = isLandlord 
    ? properties.reduce((acc, property) => {
        acc[property.property_type] = (acc[property.property_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  const inquiryStatusDistribution = inquiries.reduce((acc, inquiry) => {
    acc[inquiry.status] = (acc[inquiry.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const responseRate = inquiries.length > 0 
    ? ((inquiries.filter(i => i.status !== 'pending').length / inquiries.length) * 100).toFixed(1)
    : '0';

  const averageResponseTime = '3.2'; // Mock data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600 mt-1">
          {isLandlord 
            ? 'Track your property performance and tenant interactions'
            : 'Monitor your property search and inquiry activity'
          }
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLandlord ? (
          <>
            <MetricCard
              title="Total Revenue"
              value={formatPrice(stats.monthlyRevenue)}
              change="+12.5%"
              positive={true}
              icon={DollarSign}
            />
            <MetricCard
              title="Properties Listed"
              value={stats.totalProperties}
              change="+3"
              positive={true}
              icon={Activity}
            />
            <MetricCard
              title="Response Rate"
              value={`${responseRate}%`}
              change="+2.1%"
              positive={true}
              icon={TrendingUp}
            />
            <MetricCard
              title="Avg Response Time"
              value={`${averageResponseTime}h`}
              change="-0.5h"
              positive={true}
              icon={Calendar}
            />
          </>
        ) : (
          <>
            <MetricCard
              title="Properties Viewed"
              value="47"
              change="+8"
              positive={true}
              icon={Activity}
            />
            <MetricCard
              title="Inquiries Sent"
              value={stats.totalInquiries}
              change="+2"
              positive={true}
              icon={Users}
            />
            <MetricCard
              title="Response Rate"
              value={`${responseRate}%`}
              change="+5.2%"
              positive={true}
              icon={TrendingUp}
            />
            <MetricCard
              title="Saved Properties"
              value={stats.savedProperties}
              change="+3"
              positive={true}
              icon={Calendar}
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Inquiries Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {isLandlord ? 'Monthly Inquiries Received' : 'Monthly Activity'}
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {inquiryData.map((data, index) => (
              <div key={data.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-12">{data.month}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(data.inquiries / 25) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-8">{data.inquiries}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue/Activity Chart */}
        {isLandlord ? (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
              <LineChart className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {revenueData.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-12">{data.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(data.revenue / 7000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(data.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Search Activity</h3>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">127</div>
                <div className="text-sm text-gray-600">Properties Viewed</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-green-600">{stats.savedProperties}</div>
                  <div className="text-xs text-gray-600">Saved</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-600">{stats.totalInquiries}</div>
                  <div className="text-xs text-gray-600">Inquired</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Type Distribution (Landlord) or Inquiry Status (Tenant) */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {isLandlord ? 'Property Types' : 'Inquiry Status'}
            </h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {isLandlord ? (
              Object.entries(propertyTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.totalProperties) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-6">{count}</span>
                  </div>
                </div>
              ))
            ) : (
              Object.entries(inquiryStatusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{status}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'accepted' ? 'bg-green-600' :
                          status === 'pending' ? 'bg-yellow-600' : 
                          'bg-red-600'
                        }`}
                        style={{ width: `${(count / stats.totalInquiries) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-6">{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {isLandlord ? (
              <>
                <InsightCard
                  title="Top Performing Property"
                  value={properties[0]?.title || 'N/A'}
                  subtitle="Most inquiries received"
                  positive={true}
                />
                <InsightCard
                  title="Average Time to Respond"
                  value={`${averageResponseTime} hours`}
                  subtitle="Industry average: 4.1 hours"
                  positive={true}
                />
                <InsightCard
                  title="Conversion Rate"
                  value="23.5%"
                  subtitle="Inquiries to viewings"
                  positive={true}
                />
              </>
            ) : (
              <>
                <InsightCard
                  title="Most Active Search"
                  value="2-3 bed apartments"
                  subtitle="London area"
                  positive={true}
                />
                <InsightCard
                  title="Response Rate"
                  value={`${responseRate}%`}
                  subtitle="From landlords"
                  positive={true}
                />
                <InsightCard
                  title="Average Budget"
                  value="£1,850/month"
                  subtitle="Based on saved properties"
                  positive={true}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ 
  title, 
  value, 
  change, 
  positive, 
  icon: Icon 
}: {
  title: string;
  value: string | number;
  change: string;
  positive: boolean;
  icon: any;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className={`text-sm mt-1 ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {change} from last month
          </p>
        </div>
        <div className="p-3 bg-blue-100 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
}

function InsightCard({ 
  title, 
  value, 
  subtitle, 
  positive 
}: {
  title: string;
  value: string;
  subtitle: string;
  positive: boolean;
}) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-lg font-semibold text-blue-600 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
