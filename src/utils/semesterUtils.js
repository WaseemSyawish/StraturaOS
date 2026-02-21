/**
 * Utility functions for semester date calculations
 */

/**
 * Check if a semester is currently active based on today's date
 * @param {Object} semester - Semester object with start_date and end_date
 * @returns {boolean} - True if today falls within the semester dates
 */
export function isSemesterActive(semester) {
  if (!semester || !semester.start_date || !semester.end_date) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(semester.start_date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(semester.end_date);
  endDate.setHours(23, 59, 59, 999);
  
  return today >= startDate && today <= endDate;
}

/**
 * Find the currently active semester from a list
 * @param {Array} semesters - Array of semester objects
 * @returns {Object|null} - The active semester or null if none found
 */
export function findActiveSemester(semesters) {
  if (!Array.isArray(semesters)) return null;
  return semesters.find(sem => isSemesterActive(sem)) || null;
}

/**
 * Sort semesters with active first, then by start date
 * @param {Array} semesters - Array of semester objects
 * @returns {Array} - Sorted semesters
 */
export function sortSemestersByActivity(semesters) {
  if (!Array.isArray(semesters)) return [];
  
  return [...semesters].sort((a, b) => {
    const aActive = isSemesterActive(a);
    const bActive = isSemesterActive(b);
    
    // Active semesters come first
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    
    // Both active or both inactive: sort by start date (soonest first)
    return new Date(a.start_date) - new Date(b.start_date);
  });
}
