import ScrollHero from '../components/Home/ScrollHero'
import About from '../components/Home/About'
import Features from '../components/Home/Features'
import Highlights from '../components/Home/Highlights'
import Testimonials from '../components/Home/Testimonials'
import CTA from '../components/Home/CTA'

const Home = () => {
  return (
    // Do not put overflow-x-hidden here — it breaks position:sticky on ScrollHero.
    <div>
      <ScrollHero />
      <Features />
      <About />
      <Highlights />
      <Testimonials />
      <CTA />
    </div>
  )
}

export default Home
