import { AppProvider, useApp } from "./components/AppContext";
import { LoginPage } from "./components/LoginPage";
import { DashboardLayout } from "./components/DashboardLayout";
import { Toaster } from "./components/ui/sonner";

function AppInner() {
  const { isLoggedIn, isInitializingAuth } = useApp();
  
  if (isInitializingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: '#0b0b12' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(124, 92, 252, 0.2)', borderTopColor: '#7c5cfc', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      {isLoggedIn ? <DashboardLayout /> : <LoginPage />}
      <Toaster />
    </>
  );
}

import React, { Component, ReactNode } from "react";

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h1>Error</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </ErrorBoundary>
  );
}
