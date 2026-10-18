import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import MapView from './pages/MapView'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

// Matches vite.config.ts's `base` so routing works whether the site is
// served from the domain root (dev) or a subpath (GitHub Pages build).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

const App = () => (
    <BrowserRouter basename={basename}>
        <Layout>
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/properties' element={<Properties />} />
                <Route path='/properties/:id' element={<PropertyDetail />} />
                <Route path='/map' element={<MapView />} />
                <Route path='/about' element={<About />} />
                <Route path='/contact' element={<Contact />} />
                <Route path='*' element={<NotFound />} />
            </Routes>
        </Layout>
    </BrowserRouter>
)

export default App
