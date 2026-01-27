import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import DevOptionsNav from './components/DevOptionsNav'
import RipplingNav from './components/RipplingNav'
import GlobalNav from './components/GlobalNav'
import HomeView from './views/HomeView'
import HiringFlowView from './views/HiringFlowView'
import PeopleView from './views/PeopleView'
import StartHiringView from './views/StartHiringView'
import ComposerView from './views/ComposerView'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isTransitioningToComposer, setIsTransitioningToComposer] = useState(false)
  
  // Determine route states
  const isHiringFlow = location.pathname === '/hiring';
  const isStartHiring = location.pathname === '/start-hiring';
  const isComposer = location.pathname === '/composer';
  const hideGlobalNav = isHiringFlow || isStartHiring || isComposer;
  
  // Listen for fade-out event from FXPanel
  useEffect(() => {
    const handleFadeOut = () => {
      setIsTransitioningToComposer(true)
    }
    
    window.addEventListener('fadeOutMainContent', handleFadeOut)
    return () => window.removeEventListener('fadeOutMainContent', handleFadeOut)
  }, [])
  
  // Reset transition state when composer view is mounted or when leaving composer
  useEffect(() => {
    if (isComposer) {
      // Small delay to ensure composer view is ready
      const timer = setTimeout(() => {
        setIsTransitioningToComposer(false)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      // Reset immediately when not on composer route
      setIsTransitioningToComposer(false)
    }
  }, [isComposer])
  
  // Listen for window events to open chat panel
  useEffect(() => {
    const handleOpenPanel = (event: MessageEvent) => {
      if (event.data?.type === 'openChatPanel') {
        setIsPanelOpen(true);
      }
    };
    window.addEventListener('message', handleOpenPanel);
    return () => window.removeEventListener('message', handleOpenPanel);
  }, [])
  
  // Determine active item based on current route
  const getActiveItem = () => {
    const path = location.pathname
    if (path === '/' || path === '') return 'home'
    // Remove leading slash and match route
    const route = path.substring(1)
    // Map routes to nav item IDs (e.g., /user-plus -> 'user-plus')
    return route || 'home'
  }
  // Panel width in pixels - match FXPanel width
  const panelWidth = 359;
  // Constrain content width when panel is open
  const contentWidth = isPanelOpen ? `calc(100% - ${panelWidth}px)` : '100%';

  return (
    <div className="min-h-screen">
      <DevOptionsNav />
      <RipplingNav 
        onNavigate={navigate} 
        footerBottomOffsetPx={isHiringFlow ? 64 : 0}
        isPanelOpen={isPanelOpen}
        onPanelToggle={setIsPanelOpen}
      />
      {!hideGlobalNav && (
        <GlobalNav 
          activeItem={getActiveItem()} 
          onNavigate={navigate}
          panelWidth={isPanelOpen ? panelWidth : 0}
        />
      )}
      <div 
        className={hideGlobalNav ? "min-h-screen" : "ml-16 min-h-screen"} 
        style={{ 
          backgroundColor: hideGlobalNav ? undefined : 'var(--color-surface)',
          width: contentWidth,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Main content area - Views */}
        <div
          style={{
            opacity: (isTransitioningToComposer && !isComposer) ? 0 : 1,
            transition: isTransitioningToComposer && !isComposer 
              ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
              : 'none'
          }}
        >
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/start-hiring" element={<StartHiringView />} />
            <Route path="/hiring" element={<HiringFlowView panelWidth={isPanelOpen ? panelWidth : 0} />} />
            <Route path="/people" element={<PeopleView />} />
            <Route path="/composer" element={<ComposerView />} />
            {/* Add more routes here as needed */}
          </Routes>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
