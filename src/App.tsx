import Navbar from './components/Navbar'
import Hero from './components/Hero'
import GlobeCarousel from './components/GlobeCarousel'
import Counter from './components/Counter'
import Listen from './components/Listen'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="pt-16 overflow-x-hidden">
        <Hero />
        <GlobeCarousel />
        <Counter />
        <Listen />
      </main>
      <Footer />
    </>
  )
}
