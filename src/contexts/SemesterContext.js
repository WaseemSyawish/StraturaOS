import React, { createContext, useContext, useState, useEffect } from 'react';

const SemesterContext = createContext(null);

/**
 * SemesterProvider - Manages the currently selected semester across the app
 * This allows students to switch between semesters and have that selection
 * reflected across all pages (modules, attendance, overview, etc.)
 */
export const SemesterProvider = ({ children }) => {
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected semester from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('selectedSemester');
      if (stored) {
        setSelectedSemester(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading selected semester from localStorage:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save selected semester to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading && selectedSemester) {
      try {
        localStorage.setItem('selectedSemester', JSON.stringify(selectedSemester));
      } catch (err) {
        console.error('Error saving selected semester to localStorage:', err);
      }
    }
  }, [selectedSemester, isLoading]);

  const switchSemester = (semester) => {
    setSelectedSemester(semester);
  };

  const clearSemester = () => {
    setSelectedSemester(null);
    localStorage.removeItem('selectedSemester');
  };

  const value = {
    selectedSemester,
    switchSemester,
    clearSemester,
    isLoading,
  };

  return (
    <SemesterContext.Provider value={value}>
      {children}
    </SemesterContext.Provider>
  );
};

/**
 * Hook to use the Semester Context
 * @returns {Object} - { selectedSemester, switchSemester, clearSemester, isLoading }
 */
export const useSemesterContext = () => {
  const context = useContext(SemesterContext);
  if (!context) {
    throw new Error('useSemesterContext must be used within SemesterProvider');
  }
  return context;
};

export default SemesterContext;
