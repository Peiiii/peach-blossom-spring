import { VoxelData, VoxelShape } from './types';
import { v4 as uuidv4 } from 'uuid';

export const COLORS = {
  WOOD_DARK: '#5D4037',
  WOOD_LIGHT: '#8D6E63',
  LEAVES_DARK: '#1B5E20',
  LEAVES_LIGHT: '#4CAF50',
  PEACH_DARK: '#F06292', 
  PEACH_LIGHT: '#FFC1E3',
  ROOF_DARK: '#37474F',
  ROOF_LIGHT: '#546E7A',
  WALL: '#F5F5F5',
  WALL_DIRTY: '#E0E0E0',
  STONE: '#757575',
  GRASS: '#558B2F',
  DIRT: '#795548',
  WATER: '#29B6F6',
  CROP_WHEAT: '#FFD54F',
  CROP_GREEN: '#AED581',
  SKIN: '#FFCC80',
  CLOTH_BLUE: '#1E88E5',
  CLOTH_GREY: '#78909C',
  CLOTH_RED: '#E53935'
};

// --- Procedural Generation Helpers ---

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

// High resolution block size (0.5 units instead of 1)
export const BLOCK_SCALE = 0.5;

const createComplexHouse = (offsetX: number, offsetZ: number, rotation: number = 0): VoxelData[] => {
    const blocks: VoxelData[] = [];
    
    // Local grid coordinates
    const width = randInt(10, 14);
    const depth = randInt(8, 12);
    const height = randInt(6, 8);
    const hasPorch = Math.random() > 0.5;

    // Helper to rotate point around center
    const rotatePoint = (x: number, z: number) => {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        return {
            x: (x * cos - z * sin) * BLOCK_SCALE + offsetX,
            z: (x * sin + z * cos) * BLOCK_SCALE + offsetZ
        };
    };

    // Base Platform
    for(let x = -1; x <= width; x++) {
        for(let z = -1; z <= depth; z++) {
            const pos = rotatePoint(x - width/2, z - depth/2);
            blocks.push({ x: pos.x, y: 0 * BLOCK_SCALE, z: pos.z, color: COLORS.STONE });
        }
    }

    // Pillars & Walls
    for(let y = 1; y < height; y++) {
        for(let x = 0; x < width; x++) {
            for(let z = 0; z < depth; z++) {
                const isCorner = (x===0 || x===width-1) && (z===0 || z===depth-1);
                const isWallX = (x===0 || x===width-1);
                const isWallZ = (z===0 || z===depth-1);

                // Skip interior
                if (!isWallX && !isWallZ) continue;

                let color = COLORS.WALL;
                
                // Timber frame pillars
                if (isCorner || (x % 4 === 0 && isWallZ) || (z % 4 === 0 && isWallX)) {
                    color = COLORS.WOOD_DARK;
                }

                // Windows
                if (y > 2 && y < height-2 && !isCorner) {
                    if ((Math.abs(x - width/2) < 2 && isWallZ) || (Math.abs(z - depth/2) < 2 && isWallX)) {
                        continue; // Window hole
                    }
                }

                // Door
                if (z === depth-1 && Math.abs(x - width/2) <= 1 && y < 5) {
                    continue; // Door hole
                }

                const pos = rotatePoint(x - width/2, z - depth/2);
                blocks.push({ x: pos.x, y: y * BLOCK_SCALE, z: pos.z, color: color });
            }
        }
    }

    // Roof (Hip and Gable style)
    const roofHeight = 5;
    for(let y = 0; y <= roofHeight; y++) {
        // Overhang
        const outline = -1 + y; 
        // As y goes up, the area gets smaller
        const minX = outline;
        const maxX = width - 1 - outline;
        const minZ = outline;
        const maxZ = depth - 1 - outline;

        if (minX > maxX || minZ > maxZ) break;

        for(let x = minX - 1; x <= maxX + 1; x++) {
            for(let z = minZ - 1; z <= maxZ + 1; z++) {
                // Hollow roof
                if (x > minX && x < maxX && z > minZ && z < maxZ && y !== roofHeight) continue;

                const pos = rotatePoint(x - width/2, z - depth/2);
                blocks.push({ 
                    x: pos.x, 
                    y: (height + y) * BLOCK_SCALE, 
                    z: pos.z, 
                    color: (x === minX - 1 || x === maxX + 1 || z === minZ - 1 || z === maxZ + 1) 
                        ? COLORS.ROOF_LIGHT // Eaves
                        : COLORS.ROOF_DARK 
                });
            }
        }
    }
    
    return blocks;
};

// Generates the initial village data
export const GENERATE_VILLAGE_LAYOUT = (): VoxelShape => {
    let allBlocks: VoxelData[] = [];
    
    // Create 8-12 houses distributed organically
    // We will use a simple spiral/scatter algorithm to place them avoiding 0,0 (center)
    
    const houseCount = 10;
    for(let i=0; i<houseCount; i++) {
        const angle = (i / houseCount) * Math.PI * 2 + (Math.random() * 0.5);
        const dist = 15 + Math.random() * 25; // Scattered 15-40 units away
        
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        
        // Rotate house to face roughly center (0,0)
        const rot = angle + Math.PI / 2;
        
        allBlocks = [...allBlocks, ...createComplexHouse(x, z, rot)];
    }

    return {
        name: "Procedural Peach Blossom Village",
        blocks: allBlocks
    };
};

export const DEFAULT_VILLAGE_SHAPE = GENERATE_VILLAGE_LAYOUT();

// Fallback for API failure
export const FALLBACK_SHAPE: VoxelShape = {
    name: "Small Shrine",
    blocks: createComplexHouse(0, 0, 0)
};
