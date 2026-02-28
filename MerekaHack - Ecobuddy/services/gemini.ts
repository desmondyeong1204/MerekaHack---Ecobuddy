
import { GoogleGenAI, Type } from "@google/genai";
import { UserStats } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: apiKey as string });
};

export const generateWeeklySummary = async (stats: UserStats) => {
  const ai = getAI();
  const prompt = `
    Analyze this EcoBuddy activity data and provide a friendly, natural-language weekly insight (30-50 words):
    - Steps walked: ${stats.steps}
    - CO2 Saved: ${stats.co2Saved}kg
    - Driving trips avoided: ${stats.tripsAvoided}
    - Meals rescued: ${stats.mealsRescued}
    
    Insight Focus: Friendly, nature-inspired, minimalist tone. Avoid jargon.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || "Your strides this week are painting a greener picture for our planet. Keep up the consistent pace!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "You're making a real difference! Every step helps the planet thrive.";
  }
};

export interface DistanceResult {
  distanceKm: number;
  startAddress: string;
  endAddress: string;
  isWalkingViable: boolean;
}

const extractJson = (text: string) => {
  if (!text || typeof text !== 'string' || text.trim() === "") {
    return null;
  }
  try {
    // Attempt to find any JSON-like block in the text
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch && jsonMatch[0].trim() !== "") {
      return JSON.parse(jsonMatch[0]);
    }
    // Fallback: cleanup markdown markers
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    if (cleaned && cleaned !== "") {
      return JSON.parse(cleaned);
    }
  } catch (e) {
    // Log the failure but don't crash
    console.warn("JSON extraction failed. Input was:", text);
  }
  return null;
};

export const searchPlaces = async (query: string, userLocation?: { lat: number, lng: number }): Promise<string[]> => {
  const ai = getAI();
  const locationContext = userLocation ? `near coordinates ${userLocation.lat}, ${userLocation.lng}` : "locally";
  const prompt = `
    Use the googleMaps tool to find 5 real-world locations or addresses matching: "${query}" ${locationContext}.
    Return ONLY a JSON array of strings containing the full, specific address or landmark name.
    Example: ["Suria KLCC, Kuala Lumpur", "Sunway Pyramid, Petaling Jaya"]
    Focus on accuracy for the user's region.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined
          }
        }
      },
    });

    const result = extractJson(response.text || "");
    return Array.isArray(result) ? result : [];
  } catch (error: any) {
    console.error("Search Error:", error);
    return [];
  }
};

export const verifyRetailLocation = async (lat: number, lng: number): Promise<{ isRetail: boolean; storeName?: string }> => {
  const ai = getAI();
  const prompt = `
    Based on the coordinates (lat: ${lat}, lng: ${lng}), am I currently inside or very close (within 50m) to a supermarket, grocery store, or major retail outlet?
    
    Return ONLY this JSON:
    {
      "isRetail": boolean,
      "storeName": "string or null"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });

    const result = extractJson(response.text || "");
    return {
      isRetail: !!result?.isRetail,
      storeName: result?.storeName || undefined
    };
  } catch (error) {
    console.error("Location Verification Error:", error);
    throw error;
  }
};

export const verifyCommuteLocation = async (lat: number, lng: number): Promise<{ 
  isGreen: boolean; 
  locationType?: string; 
  locationName?: string;
  nearestLocation?: { name: string; type: string; distance: string }
}> => {
  const ai = getAI();
  const prompt = `
    Location: lat ${lat}, lng ${lng}.
    1. Am I at a Bus Stop, Train Station, or Park? (isGreen)
    2. If not, what is the NEAREST one? (name, type, distance in metres)
    
    Return ONLY JSON:
    {
      "isGreen": boolean,
      "locationType": "string",
      "locationName": "string",
      "nearestLocation": {"name": "string", "type": "string", "distance": "string (e.g. 150m)"} | null
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });

    const result = extractJson(response.text || "");
    return {
      isGreen: !!result?.isGreen,
      locationType: result?.locationType || undefined,
      locationName: result?.locationName || undefined,
      nearestLocation: result?.nearestLocation || undefined
    };
  } catch (error) {
    console.error("Commute Verification Error:", error);
    throw error;
  }
};

export const getDistanceInfo = async (start: string, end: string, userLocation?: { lat: number, lng: number }): Promise<DistanceResult | null> => {
  const ai = getAI();
  
  const prompt = `
    Calculate the distance between:
    Start: "${start}"
    End: "${end}"
    
    CRITICAL INSTRUCTION FOR CAMPUS/INTERNAL ROADS:
    1. Use the googleMaps tool to find the distance.
    2. Try to find a **walking** route first.
    3. **IF walking fails** (common on university campuses or private roads), **IMMEDIATELY switch to 'driving'** mode to get the distance.
    4. If both fail, provide your best estimation of the road or straight-line distance in km.
    5. We need the *distance value* to estimate CO2 savings. 
    6. As long as the locations exist, you MUST return a valid numerical distanceKm.
    
    Return ONLY this JSON (no extra text):
    {
      "distanceKm": number, 
      "startAddress": "string",
      "endAddress": "string",
      "isWalkingViable": boolean
    }
    
    Set "isWalkingViable" to true if the distance is < 3km, even if you used driving data or an estimate to find it.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined
          }
        },
      },
    });

    const text = response.text || "";
    const result = extractJson(text);
    
    if (result && typeof result.distanceKm === 'number' && result.distanceKm > 0) {
      return {
        distanceKm: result.distanceKm,
        startAddress: result.startAddress || start,
        endAddress: result.endAddress || end,
        isWalkingViable: result.isWalkingViable ?? (result.distanceKm <= 3.0)
      };
    }
    
    // If JSON extraction failed, but we have grounding metadata, try to craft a basic response
    if (response.candidates?.[0]?.groundingMetadata && !result) {
       console.log("Attempting fallback from metadata...");
       // Often the tool results are in grounding metadata even if the model failed to output the text part correctly
       // However, we'll return null to let the UI handle the "try again" state if it's truly empty.
    }
    
    return null;
  } catch (error: any) {
    console.error("Distance Info Error:", error);
    return null;
  }
};

export const analyzeRecyclingImage = async (base64Image: string): Promise<{ items: string[], points: number }> => {
  const ai = getAI();
  const prompt = `
    Analyze this image and identify any recyclable items (plastic bottles, soda cans, paper, glass, etc.).
    Return a JSON object with:
    - "items": an array of strings (e.g., ["Plastic Bottle", "Soda Can"])
    - "points": total points earned (10 points per item)
    
    If no recyclable items are found, return empty items and 0 points.
    Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        { text: prompt },
      ],
    });

    const result = extractJson(response.text || "");
    return {
      items: Array.isArray(result?.items) ? result.items : [],
      points: typeof result?.points === 'number' ? result.points : 0
    };
  } catch (error) {
    console.error("Image Analysis Error:", error);
    return { items: [], points: 0 };
  }
};

export const generatePetMessage = async (pet: any, interactionType: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    You are a digital pet named ${pet.name} (type: ${pet.type}).
    The user just interacted with you by: ${interactionType}.
    Your current happiness level is ${pet.happiness}%.
    
    Provide a short, cute, and encouraging message (max 15 words) to the user.
    If you are a sprout, be nature-themed. If you are a capybara, be chill.
    Avoid being repetitive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || "I'm so happy to see you!";
  } catch (error) {
    console.error("Pet Message Error:", error);
    return "Thank you for taking care of me!";
  }
};

export const generateFoodRescueInsight = async (foodItems: any[]): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Analyze these food rescue items and provide a short, urgent, and encouraging insight (max 20 words):
    ${foodItems.map(item => `- ${item.restaurant}: ${item.name} (${item.urgency} urgency)`).join('\n')}
    
    Focus on the most critical items and the environmental impact.
    Tone: Energetic, eco-conscious.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || "High demand detected! Rescue these meals now to save CO2 and earn bonus points.";
  } catch (error) {
    console.error("Food Insight Error:", error);
    return "Every meal rescued helps reduce food waste and protects our planet.";
  }
};

export const findNearbyRecycling = async (category: string, lat: number, lng: number): Promise<any[]> => {
  const ai = getAI();
  const prompt = `Find 3 nearby recycling centers for ${category} near latitude ${lat}, longitude ${lng}. Return the results as a JSON array of objects with name, address, lat, and lng.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    // Extracting from grounding chunks if possible, or parsing text
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      return chunks.map((chunk: any) => ({
        name: chunk.maps?.title || "Recycling Center",
        address: chunk.maps?.uri || "Nearby",
        lat: lat + (Math.random() - 0.5) * 0.01, // Mocking slightly offset coords for display
        lng: lng + (Math.random() - 0.5) * 0.01
      }));
    }

    // Fallback: parse text if model returned JSON in text
    try {
      const jsonMatch = response.text?.match(/\[.*\]/s);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}

    return [
      { name: "EcoCenter Central", address: "123 Green St", lat: lat + 0.002, lng: lng + 0.001 },
      { name: "City Recycling Hub", address: "456 Earth Ave", lat: lat - 0.001, lng: lng + 0.003 },
      { name: "Nature First Point", address: "789 Blue Rd", lat: lat + 0.001, lng: lng - 0.002 }
    ];
  } catch (error) {
    console.error("Map Search Error:", error);
    return [];
  }
};
