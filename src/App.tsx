import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import ListingDetail from './pages/ListingDetail'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

// Matches vite.config.ts's `base` so routing works whether the site is
// served from the domain root (Firebase Hosting, dev) or a subpath
// (GitHub Pages build).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

const App = () => (
    <AuthProvider>
        <BrowserRouter basename={basename}>
            <Layout>
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/properties' element={<Properties />} />
                    <Route path='/properties/:id' element={<PropertyDetail />} />
                    <Route path='/listings/:id' element={<ListingDetail />} />
                    {/* The standalone map view is now the left panel of /properties. */}
                    <Route path='/map' element={<Navigate to='/properties' replace />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/about' element={<About />} />
                    <Route path='/contact' element={<Contact />} />
                    <Route path='*' element={<NotFound />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    </AuthProvider>
)

export default App
