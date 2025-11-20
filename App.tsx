import React from 'react';
import { PresenterProvider } from './context/PresenterContext';
import { GameUI } from './components/GameUI';
import { GameCanvas } from './components/GameCanvas';
import { useWorldStore } from './stores/worldStore';

const Layout = () => {
  const isNight = useWorldStore(state => state.isNight);
  const bgDay = '#87CEEB';
  const bgNight = '#0b1026';

  return (
    <div className={`relative w-full h-screen select-none transition-colors duration-1000`} style={{ backgroundColor: isNight ? bgNight : bgDay }}>
      <GameUI />
      <GameCanvas />
    </div>
  );
}

const App = () => {
  return (
    <PresenterProvider>
      <Layout />
    </PresenterProvider>
  );
};

export default App;
