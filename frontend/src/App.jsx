import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Dashboard from './components/Dashboard';
import WorkflowBuilder from './components/WorkflowBuilder';
import { Zap } from 'lucide-react';
import { stacksApi } from './api';
import './index.css';

// Views
const VIEWS = {
  DASHBOARD: 'dashboard',
  BUILDER: 'builder',
};

function App() {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [stacks, setStacks] = useState([]);
  const [currentStack, setCurrentStack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load stacks from API on mount
  useEffect(() => {
    fetchStacks();
  }, []);

  const fetchStacks = async () => {
    setLoading(true);
    try {
      const data = await stacksApi.getAll();
      setStacks(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load stacks:', err);
      setError('Failed to connect to backend server. Please ensure it is running.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new stack
  const handleCreateStack = async () => {
    const newStackData = {
      name: 'Untitled Stack',
      nodes: [],
      edges: [],
    };

    try {
      const createdStack = await stacksApi.create(newStackData);
      setStacks((prev) => [...prev, createdStack]);
      setCurrentStack(createdStack);
      setCurrentView(VIEWS.BUILDER);
    } catch (err) {
      console.error('Failed to create stack:', err);
      alert('Failed to create stack. Is the backend running?');
    }
  };

  // Edit existing stack
  const handleEditStack = (stack) => {
    setCurrentStack(stack);
    setCurrentView(VIEWS.BUILDER);
  };

  // Save stack
  const handleSaveStack = async (updatedStack) => {
    try {
      const savedStack = await stacksApi.update(updatedStack.id, updatedStack);

      setStacks((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === updatedStack.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedStack;
          return updated;
        }
        return [...prev, savedStack];
      });

      setCurrentStack(savedStack);
    } catch (err) {
      console.error('Failed to save stack:', err);
      alert('Failed to save stack.');
    }
  };

  // Delete stack
  const handleDeleteStack = async (stackId) => {
    if (window.confirm('Are you sure you want to delete this stack?')) {
      try {
        await stacksApi.delete(stackId);
        setStacks((prev) => prev.filter((s) => s.id !== stackId));
      } catch (err) {
        console.error('Failed to delete stack:', err);
        alert('Failed to delete stack.');
      }
    }
  };

  // Go back to dashboard
  const handleBack = () => {
    setCurrentView(VIEWS.DASHBOARD);
    setCurrentStack(null);
    fetchStacks(); // Refresh list when returning to dashboard
  };

  // Render loading state
  if (loading && currentView === VIEWS.DASHBOARD) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <Zap size={48} color="var(--primary-green)" className="animate-pulse" />
        <p>Connecting to backend...</p>
      </div>
    );
  }

  // Render Error state
  if (error && currentView === VIEWS.DASHBOARD && stacks.length === 0) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ color: 'var(--error)', marginBottom: '16px' }}>
          <Zap size={48} />
        </div>
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchStacks}>
          Retry Connection
        </button>
      </div>
    );
  }

  // Render Dashboard
  if (currentView === VIEWS.DASHBOARD) {
    return (
      <div className="app-container">
        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-logo">
              <Zap size={28} />
              GenAI Stack Builder
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <Dashboard
          stacks={stacks}
          onCreateStack={handleCreateStack}
          onEditStack={handleEditStack}
          onDeleteStack={handleDeleteStack}
        />
      </div>
    );
  }

  // Render Workflow Builder
  if (currentView === VIEWS.BUILDER) {
    return (
      <WorkflowBuilder
        stack={currentStack}
        onBack={handleBack}
        onSave={handleSaveStack}
      />
    );
  }

  return null;
}

export default App;
