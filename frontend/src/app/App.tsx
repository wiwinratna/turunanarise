import { AppProvider, useApp } from "./components/AppContext";
import { LoginPage } from "./components/LoginPage";
import { DashboardLayout } from "./components/DashboardLayout";
import { Toaster } from "./components/ui/sonner";
import { motion } from "motion/react";

function AppInner() {
  const { isLoggedIn, isInitializingAuth, theme, sidebarLogo } = useApp();
  
  if (isInitializingAuth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: theme.backgroundColor }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
        >
          {sidebarLogo ? (
             <motion.img 
                src={sidebarLogo} 
                alt="Logo" 
                style={{ height: 60, objectFit: 'contain' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             />
          ) : (
            <motion.div
              style={{
                width: 60,
                height: 60,
                borderRadius: '25%',
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor || theme.primaryColor})`,
                boxShadow: `0 0 30px ${theme.primaryColor}40`,
              }}
              animate={{ 
                rotate: 360,
                borderRadius: ["25%", "50%", "25%"]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <motion.div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: theme.primaryColor,
                }}
                animate={{
                  y: ["0%", "-100%", "0%"],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15
                }}
              />
            ))}
          </motion.div>
        </motion.div>
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
