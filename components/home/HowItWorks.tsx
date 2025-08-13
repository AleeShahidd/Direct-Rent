export function HowItWorks() {
  const steps = [
    {
      step: '1',
      title: 'Search Properties',
      description: 'Browse our extensive collection of verified rental properties across the UK.',
      icon: '🔍'
    },
    {
      step: '2',
      title: 'Contact Landlords',
      description: 'Connect directly with property owners without paying agency fees.',
      icon: '💬'
    },
    {
      step: '3',
      title: 'Book Viewing',
      description: 'Schedule a convenient time to view your potential new home.',
      icon: '📅'
    },
    {
      step: '4',
      title: 'Move In',
      description: 'Complete the rental agreement and get your keys to start your new chapter.',
      icon: '🏠'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">Find your perfect rental property in just four simple steps</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full text-2xl font-bold mb-4">
                {step.step}
              </div>
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
