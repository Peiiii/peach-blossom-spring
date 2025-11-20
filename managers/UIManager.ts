import { useUIStore } from '../stores/uiStore';

export class UIManager {
  toggleControls = () => {
    const { showControls, setShowControls } = useUIStore.getState();
    setShowControls(!showControls);
  }
}
