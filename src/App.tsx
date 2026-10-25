import './App.css'
import SegmentControl from './Components/SegmentControl/SegmentControl'
import { segments, segmentsConfig } from './segmentsConfig'
import { AppSettingsProvider, useAppSettings } from './Hooks/useAppSettings'

import Splash from './Segments/Splash'

import ErrorBoundary from './Error/ErrorBoundary'
import BackendGate from './Backends/BackendGate'
import AuthGate from './Auth/AuthGate'
import UserCard from './Auth/UserCard'
import { features } from './features'

function AppShell() {
  const { selectedSegment, setSelectedSegment } = useAppSettings();

  // Already in tab order - see SEGMENT_ORDER in segmentsConfig.ts
  const orderedSegments = segments;

  const handleSelectionChange = (item: string) => {
    setSelectedSegment(item);
  };

  const renderApplication = () => {
    if (!selectedSegment) {
      // No selection - show splash screen
      return <Splash />;
    }

    const segmentConfig = segmentsConfig.find(s => s.name.toLowerCase() === selectedSegment.toLowerCase());
    if (segmentConfig) {
        const SegmentComponent = segmentConfig.component;
        return (
            <ErrorBoundary key={segmentConfig.name} label={segmentConfig.name}>
                <BackendGate backends={segmentConfig.requiredBackends}>
                    <SegmentComponent />
                </BackendGate>
            </ErrorBoundary>
        );
    }

    // Fallback to splash if component not found
    return <Splash />;
  };

  const getSelectedIndex = () => {
    if (!selectedSegment) {
      return -1; // No selection
    }
    return orderedSegments.findIndex(segment => segment.toLowerCase() === selectedSegment.toLowerCase());
  };

  return (
    <div className="app-container">
        <div className="app-segment">
            <SegmentControl
                items={orderedSegments}
                selectedIndex={getSelectedIndex()}
                onSelectionChange={handleSelectionChange}
                colorScheme="primary"
                className="custom-segment"
            />
            {features.authGoogle && <UserCard />}
        </div>
        <div className="app-main">
            {renderApplication()}
        </div>
    </div>
  )
}

function App() {
    const shell = (
        <AppSettingsProvider>
            <AppShell />
        </AppSettingsProvider>
    );

    // With Google sign-in on, nothing renders until the session is confirmed - EscapeVelocity's login gate.
    return features.authGoogle ? <AuthGate>{shell}</AuthGate> : shell;
}

export default App
