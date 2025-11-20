import React, { useEffect } from 'react';
import { usePresenter } from '../context/PresenterContext';
import { useWorldStore } from '../stores/worldStore';
import { useUIStore } from '../stores/uiStore';
import { AppState } from '../types';

export const GameUI = () => {
  const presenter = usePresenter();
  
  // State Subscriptions
  const showControls = useUIStore(state => state.showControls);
  const isNight = useWorldStore(state => state.isNight);
  const appState = useWorldStore(state => state.appState);
  const isGenerating = useWorldStore(state => state.isGenerating);

  // Key Binding Logic
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.code === 'KeyH') {
        presenter.uiManager.toggleControls();
      }
      if (e.code === 'KeyT') {
        presenter.worldManager.toggleNight();
      }
    };
    (window as any).addEventListener('keydown', handleKeyDown);
    return () => (window as any).removeEventListener('keydown', handleKeyDown);
  }, [presenter]);

  return (
    <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col items-start">
            <h1 className="text-2xl md:text-4xl font-pixel text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2">
            PEACH BLOSSOM SPRING
            </h1>
            
            <div className="pointer-events-auto mt-2 flex flex-col gap-2 items-start">
                <div className="flex gap-2">
                    <button 
                        onClick={presenter.uiManager.toggleControls}
                        className="bg-black/40 hover:bg-black/60 text-white/70 font-pixel text-[10px] py-2 px-3 rounded backdrop-blur-md border border-white/10 transition-all"
                    >
                        {showControls ? '[-] CONTROLS' : '[H] CONTROLS'}
                    </button>
                    <button 
                        onClick={presenter.worldManager.toggleNight}
                        className="bg-black/40 hover:bg-black/60 text-white/70 font-pixel text-[10px] py-2 px-3 rounded backdrop-blur-md border border-white/10 transition-all"
                    >
                        {isNight ? '[T] SUN' : '[T] MOON'}
                    </button>
                </div>

                {showControls && (
                    <div className="bg-black/80 p-4 rounded-lg backdrop-blur-md border border-white/20 w-[200px] shadow-xl mt-2">
                         <div className="space-y-3 font-pixel text-[10px] text-white/90">
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>MOVE</span> <span className="text-yellow-400">WASD</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>JUMP</span> <span className="text-yellow-400">SPACE</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>DESCEND</span> <span className="text-yellow-400">SHIFT</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>FLY</span> <span className="text-yellow-400">F</span></div>
                            <div className="flex justify-between border-b border-white/10 pb-1"><span>TIME</span> <span className="text-yellow-400">T</span></div>
                            <div className="flex justify-between"><span>VIEW</span> <span className="text-yellow-400">DRAG</span></div>
                         </div>
                    </div>
                )}
            </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-4 items-end">
            {appState === AppState.IDLE && (
                <button onClick={presenter.worldManager.smash} className="bg-red-600 hover:bg-red-500 text-white font-pixel py-4 px-8 rounded-xl shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all">
                DESTROY VILLAGE
                </button>
            )}

            {appState === AppState.EXPLODING && (
                <button onClick={presenter.worldManager.rebuild} disabled={isGenerating} className={`bg-green-600 hover:bg-green-500 text-white font-pixel py-4 px-8 rounded-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all ${isGenerating ? 'opacity-70' : ''}`}>
                {isGenerating ? 'CONSULTING SPIRITS...' : 'REBUILD (AI)'}
                </button>
            )}
        </div>
    </div>
  );
};