import Hero from '../components/Home/Hero'
import UpcomingEvents from '../components/Home/UpcomingEvents'
import About from '../components/Home/About'
import Features from '../components/Home/Features'
import Highlights from '../components/Home/Highlights'
import Testimonials from '../components/Home/Testimonials'
import CTA from '../components/Home/CTA'

const Home = () => {
  return (
    <div className="overflow-x-hidden max-w-[100vw]">
      <Hero />
      <UpcomingEvents />
      <Features />
      <About />
      <Highlights />
      <Testimonials />
      <CTA />
    </div>
  )
}

export default Home
