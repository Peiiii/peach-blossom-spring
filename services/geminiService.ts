import { GoogleGenAI, Type } from "@google/genai";
import { VoxelShape } from "../types";
import { FALLBACK_SHAPE, COLORS, BLOCK_SCALE } from "../constants";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateNewHouseShape = async (currentShapeName: string): Promise<VoxelShape> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found, returning fallback shape.");
    return FALLBACK_SHAPE;
  }

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a complex 3D voxel structure representing a new form for the village.
      It should be different from a "${currentShapeName}". 
      Examples: "Grand Ancestral Hall", "Dragon Bridge", "Market Watchtower", "Twin Pagodas".
      
      IMPORTANT: 
      1. Use a coordinate scale where 1 unit = 1 block. But visually these blocks are small (${BLOCK_SCALE} size).
      2. Max dimensions: 20x20 width/depth, 20 height.
      3. Use these colors: 
         Wood (${COLORS.WOOD_DARK}), Roof (${COLORS.ROOF_DARK}), Walls (${COLORS.WALL}), Gold/Decor (${COLORS.CROP_WHEAT}).
      4. Create detailed architectural features like flying eaves, support beams, or stone foundations.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  z: { type: Type.NUMBER },
                  color: { type: Type.STRING }
                },
                required: ["x", "y", "z", "color"]
              }
            }
          },
          required: ["name", "blocks"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned");
    
    const data = JSON.parse(jsonText) as VoxelShape;
    
    // Ensure generated blocks align with our 0.5 scale system if Gemini returns Integers
    const scaledBlocks = data.blocks.map(b => ({
        ...b,
        x: b.x * BLOCK_SCALE,
        y: b.y * BLOCK_SCALE,
        z: b.z * BLOCK_SCALE
    }));

    return { ...data, blocks: scaledBlocks };

  } catch (error) {
    console.error("Gemini generation failed:", error);
    return FALLBACK_SHAPE;
  }
};
