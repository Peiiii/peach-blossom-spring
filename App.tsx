import React from 'react';
import { PresenterProvider } from './context/PresenterContext';
import { GameUI } from './components/GameUI';
import { GameCanvas } from './components/GameCanvas';

const Layout = () => {
  return (
    <div className={`relative w-full h-screen select-none`}>
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