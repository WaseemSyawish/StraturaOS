# Semester System - User Guide

## What Changed

Your modules page now has a **dynamic semester system** based on date ranges and user-defined names.

## Current State

✅ **Your 3 existing courses are safe!**

- They currently have `semester: "2025 - 1"`
- They will display under **"All Modules"** until you configure semesters

## How It Works Now

### 1. **Semester Configuration**

- Click the "Semester Configuration" section on the modules page
- Create semesters with:
  - **Name**: Any name you want (e.g., "Fall 2025", "Spring 2026", "2025 - 1")
  - **Start Date**: When the semester begins
  - **End Date**: When the semester ends

### 2. **Automatic Date-Based Display**

The system automatically shows:

- **Current Semester**: Today's date falls between start_date and end_date
- **Upcoming Semester**: start_date is in the future
- **Previous Semesters**: end_date is in the past

### 3. **Smart Course Matching**

Courses are matched to semesters by:

1. **Semester name** - If course.semester matches semesterSetting.name
2. **Semester ID** - For newly created courses

## Migration Path for Your Existing Courses

### Option 1: Match Existing Semester Name

1. Create a new semester named exactly **"2025 - 1"**
2. Set appropriate start and end dates
3. Your courses will automatically appear in that semester!

### Option 2: Create New Semesters & Reassign

1. Create semesters with new names (e.g., "Fall 2025")
2. Edit each course
3. Select the new semester from the dropdown
4. Save

## Example Setup

```
Semester 1:
- Name: "Fall 2025"
- Start: September 1, 2025
- End: December 20, 2025

Semester 2:
- Name: "Spring 2026"
- Start: January 15, 2026
- End: May 30, 2026
```

## Features

✅ **Date-based filtering** - Shows active/upcoming/previous automatically
✅ **User-defined names** - Name your semesters however you want
✅ **Backward compatible** - Existing courses still work
✅ **No data loss** - All your course data is preserved
✅ **Optional** - If no semesters configured, shows all modules

## What Happens When

- **No semesters configured**: Shows all modules under "All Modules"
- **Active semester exists**: Shows modules for that semester with date range
- **Semester expires**: Automatically moves to "Previous Semesters"
- **New semester starts**: Automatically becomes "Current Semester"

## Future Enhancements (Not Yet Implemented)

- 🔄 Archive semesters 2 months after end date
- 👁️ Show/hide toggle for previous semesters
- 📊 Semester statistics and analytics
- 📅 Academic calendar integration

## Need Help?

Your courses are **safe and displaying**. The semester system is now fully functional with:

- ✅ Database schema updated
- ✅ API endpoints working
- ✅ UI fully restored
- ✅ Smart matching logic
- ✅ Backward compatibility

Just create your first semester and start organizing!
