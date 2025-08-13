export function Stats() {
  const stats = [
    {
      value: '10,000+',
      label: 'Properties Listed',
      description: 'Verified rental properties across the UK'
    },
    {
      value: '50,000+',
      label: 'Happy Tenants',
      description: 'Successfully matched with their ideal homes'
    },
    {
      value: '5,000+',
      label: 'Trusted Landlords',
      description: 'Verified property owners on our platform'
    },
    {
      value: '£0',
      label: 'Agency Fees',
      description: 'Direct connections mean no hidden costs'
    }
  ];

  return (
    <section className="py-16 bg-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">DirectRent UK by the Numbers</h2>
          <p className="text-lg text-blue-100">Join thousands of satisfied users across the United Kingdom</p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-xl font-semibold text-blue-100 mb-2">{stat.label}</div>
              <div className="text-blue-200 text-sm">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;
