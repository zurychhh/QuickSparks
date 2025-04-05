interface ConversionState {
  conversionId: string;
  fileName?: string;
  fileSize?: number;
  conversionType: string;
  timestamp: number;
}

/**
 * Saves the current conversion state to localStorage
 * @param data - The conversion state data to save
 */
export const saveConversionState = (data: {
  conversionId: string;
  fileName?: string;
  fileSize?: number;
  conversionType: string;
}): void => {
  if (!data.conversionId) return;
  
  const stateToSave: ConversionState = {
    ...data,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem('conversionState', JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Error saving conversion state:', error);
  }
};

/**
 * Retrieves the saved conversion state from localStorage
 * @param maxAgeMinutes - Maximum age in minutes for valid state
 * @returns The saved conversion state if within age limit, null otherwise
 */
export const getConversionState = (maxAgeMinutes: number = 30): ConversionState | null => {
  try {
    const savedState = localStorage.getItem('conversionState');
    if (!savedState) return null;
    
    const state = JSON.parse(savedState) as ConversionState;
    
    // Check if state is recent enough
    const isRecent = (Date.now() - state.timestamp) < (maxAgeMinutes * 60 * 1000);
    if (!isRecent) {
      // Clear outdated state
      localStorage.removeItem('conversionState');
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Error retrieving conversion state:', error);
    localStorage.removeItem('conversionState');
    return null;
  }
};

/**
 * Clears the saved conversion state
 */
export const clearConversionState = (): void => {
  localStorage.removeItem('conversionState');
};