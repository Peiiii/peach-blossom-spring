import { WorldManager } from './managers/WorldManager';
import { UIManager } from './managers/UIManager';

export class Presenter {
  worldManager: WorldManager;
  uiManager: UIManager;

  constructor() {
    this.worldManager = new WorldManager();
    this.uiManager = new UIManager();
  }

  init = () => {
    this.worldManager.init();
  }
}
