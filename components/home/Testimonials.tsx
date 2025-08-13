export function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      location: 'London',
      role: 'Tenant',
      content: 'Found my perfect flat in London without any agency fees. The direct communication with the landlord made everything so much smoother!',
      rating: 5
    },
    {
      name: 'Mike Thompson',
      location: 'Manchester',
      role: 'Landlord',
      content: 'As a landlord, DirectRent UK has helped me find reliable tenants quickly. The verification process gives me confidence in who I rent to.',
      rating: 5
    },
    {
      name: 'Emma Williams',
      location: 'Birmingham',
      role: 'Tenant',
      content: 'The search filters are fantastic! I was able to find a pet-friendly property with a garden in my budget within days.',
      rating: 5
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
          <p className="text-lg text-gray-600">Real stories from landlords and tenants using DirectRent UK</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">&ldquo;{testimonial.content}&rdquo;</p>
              <div className="border-t pt-4">
                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                <div className="text-sm text-gray-600">{testimonial.role} • {testimonial.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
