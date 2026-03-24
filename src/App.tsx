import NavBar from './components/NavBar'
import Hero from './components/Hero'
import Concept from './components/Concept'
import Cities from './components/Cities'
import Counter from './components/Counter'
import Listen from './components/Listen'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <NavBar />
      <main className="pt-16 overflow-x-hidden">
        <Hero />
        <Concept />
        <Cities />
        <Counter />
        <Listen />
      </main>
      <Footer />
    </>
  )
}
