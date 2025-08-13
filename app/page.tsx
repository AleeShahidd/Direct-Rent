import { 
  HeroSection,
  FeaturedProperties,
  HowItWorks,
  Stats,
  Testimonials 
} from '../components/home'

export default function HomePage() {
  return (
    
    <div className="min-h-screen">
      <HeroSection />
      <Stats />
      <FeaturedProperties />
      <HowItWorks />
      <Testimonials />
    </div>
  )
}
