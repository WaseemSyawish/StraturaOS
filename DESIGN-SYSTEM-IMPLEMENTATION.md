# Design System Implementation Plan

## University Planner UI Modernization

---

## 🎯 Core Design Principles

- **Clean & Calm**: Reduce visual noise, increase whitespace
- **Smooth Transitions**: 200-300ms animations, subtle scale/fade effects
- **Consistent Spacing**: 4px base unit (gaps: 12px, 16px, 20px, 24px)
- **Typography Hierarchy**: Clear font sizes and weights
- **Modern Minimalism**: Remove unnecessary borders, use subtle shadows

---

## 📐 Component Library Reference

### Navbar (Horizontal Top Bar)

**Reference**: Header Navigation designs with hamburger menu
**Key Features**:

- Height: 64px
- Background: White with subtle shadow (0 1px 3px rgba(0,0,0,0.1))
- Left: Hamburger menu icon (24×24px) + Logo/Brand
- Center: Page title or breadcrumb
- Right: User actions (search, notifications, profile avatar)
- Border-bottom: 1px solid slate-100
- Z-index: 50 (above content, below modals)

**Implementation Details**:

- Hamburger toggles sidebar on mobile
- Fixed position at top
- Backdrop blur on scroll: backdrop-blur-sm bg-white/90
- Icons: Lucide-react, 20px size, stroke-width: 2
- Avatar: 32×32px rounded-full with online indicator (green dot)

### Sidebar (Vertical Navigation)

**Reference**: Hygraph-style sidebar with icons + labels
**Key Features**:

- Width: 240px (expanded), 64px (collapsed)
- Background: Gradient from slate-900 → slate-800 OR white with border
- Padding: 16px vertical, 12px horizontal
- Item height: 40px
- Icon size: 20×20px
- Selected state: bg-purple-600 text-white rounded-lg
- Hover state: bg-slate-700/50 (dark) or bg-slate-100 (light)

**Navigation Structure**:

```
[Logo/Brand - 48px height]
[Search bar - optional]

MAIN
├─ Dashboard (Home icon)
├─ Tasks (CheckSquare icon)
├─ Timetable (Calendar icon)
├─ Modules (BookOpen icon)
├─ Grades (Award icon)
└─ Attendance (UserCheck icon)

PRODUCTIVITY
├─ Focus (Timer icon)
├─ Sessions (Clock icon)
└─ Analytics (BarChart icon)

SETTINGS
├─ Preferences (Settings icon)
├─ Help & Support (HelpCircle icon)
└─ [User Account - bottom]
    ├─ Avatar + Name
    └─ Sign Out
```

**Implementation Details**:

- Smooth collapse/expand animation (300ms ease-in-out)
- Icons remain visible when collapsed
- Tooltip on hover when collapsed (Tippy.js or native)
- Active page highlighted with left border accent (4px purple-600)
- Section labels: 11px uppercase tracking-[0.3em] text-slate-400

---

## 🏠 Overview Page Redesign

### Hero Section (Top)

**Reference**: Doozy.co hero with blue gradient card
**Layout**: Full-width, 160px height

- **Gradient Card**: Blue gradient (from-blue-600 to-indigo-700)
- **Content**:
  - Left: "Hi, {Name} 👋" + personalized message
  - Right: "Task On Progress" button (white, rounded-full)
- **Corner Icons**: Settings, notifications in top-right

### Stats Cards Row

**Reference**: Doozy.co "Workload by Status"
**Layout**: 3 cards, equal width, 16px gap

1. **Total Tasks** - Blue accent
   - Icon: Layers
   - Number: Large (32px font)
   - Subtitle: "All tasks"
2. **In Progress** - Orange accent
   - Icon: Clock
   - Number + Percentage
   - Mini bar chart below
3. **Completed** - Green accent
   - Icon: CheckCircle2
   - Number + Percentage
   - Mini bar chart below

**Card Style**:

- Border: 1px solid slate-200
- Border-radius: 16px
- Padding: 20px
- Shadow: sm on hover → md (smooth transition)
- Icon: 40×40px circle with colored background (opacity 10%)

### Main Content Grid

**Layout**: 3 columns (on desktop)

#### Column 1: Recent Tasks (40%)

**Reference**: Doozy.co "Recently Task" section

- **Header**: "Recent Tasks" + "View All" link
- **Task Cards**:
  - Priority tag (High/Medium/Low) - colored badge
  - Title (font-semibold)
  - Description (text-sm text-slate-600, 2 lines max)
  - Progress bar (colored by priority)
  - Assignee avatars (overlapping circles)
  - Icons: Comments count, Likes count
- **Card Style**:
  - Border: 1px solid slate-100
  - Hover: translate-y(-2px) + shadow-md
  - Padding: 16px
  - Border-radius: 12px

#### Column 2: Schedule/Timeline (30%)

**Reference**: Doozy.co "Schedule" section with meetings

- **Header**: "Today's Schedule" + date
- **Event Cards**:
  - Time badge (colored by type)
  - Platform icon (Zoom, Google Meet)
  - Event title
  - Participants avatars
  - "View Detail" link (colored, underline on hover)
- **Empty State**:
  - Calendar icon (gray)
  - "No classes today"
  - "Enjoy your free day!"

#### Column 3: This Week Summary (30%)

**Reference**: Keep existing "This Week" widget style

- Week navigation (Mon-Sun with date numbers)
- Current day highlighted (purple background)
- Stats below:
  - Classes: 6/6 with progress bar (full width)
  - Assignments: "1 due" (amber text)
  - Study Hours: "0h / 20h" (gray → needs work indicator)
- "Start Focus" button at bottom

### Task List Table (Below Grid)

**Reference**: Doozy.co "List Task" with columns
**Layout**: Full-width table, alternating row colors
**Columns**:

1. Checkbox (for bulk actions)
2. Task Name (with priority dot)
3. Start Date (MMM D, YYYY)
4. Due Date (MMM D, YYYY)
5. Progress (green bar with percentage)
6. Assignee (avatar + name)
7. Attachment (file icon if present)
8. Priority (colored badge)

**Table Style**:

- Header: bg-slate-50, text-xs uppercase tracking-wider text-slate-600
- Rows: hover:bg-purple-50, cursor-pointer
- Border: None between rows, just bg color change
- Padding: 12px per cell
- Font: 14px regular for data

---

## 🎨 Color System

### Primary Palette

- **Purple**: #7c3aed (purple-600) - Primary actions, links
- **Slate**: #64748b (slate-500) - Body text
- **White/Black**: Pure white backgrounds, slate-900 text

### Status Colors

- **Todo**: #64748b (slate-500) - Gray
- **In Progress**: #f59e0b (amber-500) - Orange
- **Completed**: #10b981 (emerald-500) - Green
- **Delegate**: #3b82f6 (blue-500) - Blue

### Semantic Colors

- **Success**: emerald-500
- **Warning**: amber-500
- **Error**: red-500
- **Info**: blue-500

### Background Gradients

- **Hero Cards**: from-blue-600 to-indigo-700
- **Stat Cards**: Subtle from-slate-50 to-white
- **Sidebar (Dark)**: from-slate-900 via-slate-800 to-slate-900

---

## 🎭 Animation Guidelines

### Modal Animations

**Entry**:

```css
/* Backdrop */
opacity: 0 → 1 (200ms ease-out)

/* Modal */
scale: 0.95 → 1 (300ms cubic-bezier(0.16, 1, 0.3, 1))
opacity: 0 → 1 (200ms ease-out)
```

**Exit**:

```css
/* Reverse of entry, 200ms faster */
scale: 1 → 0.98 (200ms ease-in)
opacity: 1 → 0 (150ms ease-in)
```

### Task Creation Success

1. Modal scales down to 0.9 (100ms)
2. Green checkmark appears (scale-in with bounce)
3. "Task Created!" text fades in
4. After 800ms: Modal fades out
5. New task card animates in from top of list (slide-down + fade)

### Task Deletion

1. Confirmation modal with red accent
2. On confirm: Task card slides right with fade-out (300ms)
3. Other tasks smoothly collapse the gap (400ms ease-in-out)
4. Toast notification: "Task deleted" with undo button (5s duration)

### Hover Effects

- **Cards**: translate-y(-2px) + shadow-sm → shadow-md (200ms)
- **Buttons**: scale(1.02) + brightness(1.05) (150ms)
- **Icons**: rotate(5deg) OR scale(1.1) (200ms)

### Loading States

- **Skeleton screens**: Animated gradient (shimmer effect)
- **Spinners**: Smooth rotation (1s linear infinite)
- **Progress bars**: Indeterminate animation (2s ease-in-out)

---

## 📊 Typography Scale

```
Headings:
- h1: 32px / font-bold / leading-tight
- h2: 24px / font-bold / leading-snug
- h3: 20px / font-semibold / leading-normal
- h4: 18px / font-semibold / leading-normal

Body:
- Large: 16px / font-normal / leading-relaxed
- Base: 14px / font-normal / leading-normal
- Small: 13px / font-normal / leading-normal
- Tiny: 12px / font-normal / leading-normal

Labels:
- Uppercase: 11px / font-semibold / tracking-[0.3em] / uppercase
```

---

## 🔧 Implementation Priority

### Phase 1: Foundation (Week 1)

1. ✅ Fix task creation (DONE)
2. ✅ Fix credits widget to show 75 credits (4 modules × 15)
3. Create reusable Navbar component
4. Modernize Sidebar component
5. Setup animation utilities (Framer Motion or CSS transitions)

### Phase 2: Overview Page (Week 2)

1. Redesign hero section with gradient card
2. Implement stats cards with mini charts
3. Build "Recent Tasks" section with priority cards
4. Create "Today's Schedule" timeline
5. Add task list table below

### Phase 3: Modal Improvements (Week 3)

1. Smooth entry/exit animations for all modals
2. Task creation success feedback (checkmark + message)
3. Task deletion confirmation with undo
4. Better ReminderPicker animations
5. Toast notification system

### Phase 4: Consistency Pass (Week 4)

1. Apply navbar to Timetable, Grades, History pages
2. Ensure all icons are same size (20px)
3. Consistent button styles across app
4. Standardize card shadows and borders
5. Polish all hover states

---

## 🚫 Timetable Timeless Tasks - Alternative Solution

**Problem**: Timetable needs start/end times, but tasks can be timeless
**Current Options Rejected**:

- ❌ All-day band (takes too much space)
- ❌ Hide entirely (defeats purpose)

**PROPOSED SOLUTION**: **Smart Default + Separate Section**

1. **Timeless tasks** get default time: 9:00 AM - 10:00 AM
2. Display with **dashed border** to indicate "not scheduled"
3. Show in lighter opacity (0.6) compared to scheduled events
4. Add **"Unscheduled"** section at top of day (collapsible)
5. Click to schedule → opens time picker modal
6. Option to "Schedule Later" keeps it in unscheduled section

**Visual Treatment**:

- Border: dashed 2px slate-300
- Background: slate-50 (not colored)
- Icon: Clock with question mark
- Tooltip: "Click to set time"

---

## 📝 Component Checklist

### Navbar

- [ ] Create TopNavbar.jsx component
- [ ] Hamburger menu toggle
- [ ] Logo/brand positioning
- [ ] Page title dynamic
- [ ] User avatar with dropdown
- [ ] Notification bell with badge
- [ ] Search icon (optional)
- [ ] Mobile responsive (collapse to hamburger)

### Sidebar

- [ ] Create ModernSidebar.jsx component
- [ ] Collapse/expand functionality
- [ ] Icon + label layout
- [ ] Active state highlighting
- [ ] Section headers (MAIN, PRODUCTIVITY, SETTINGS)
- [ ] User account at bottom
- [ ] Tooltips on collapsed state
- [ ] Smooth animation (300ms)

### Overview Page

- [ ] Hero gradient card with greeting
- [ ] Three stats cards with icons
- [ ] Recent tasks section (priority cards)
- [ ] Today's schedule timeline
- [ ] This week summary widget
- [ ] Task list table with all columns
- [ ] Empty states for each section

### Modals

- [ ] Scale + fade entry animation
- [ ] Backdrop blur effect
- [ ] Success feedback (checkmark + message)
- [ ] Error feedback (shake + red border)
- [ ] Delete confirmation with undo
- [ ] Escape key to close
- [ ] Click outside to close

---

## 🎬 Animation Library Setup

**Recommended**: Framer Motion for React

```bash
npm install framer-motion
```

**Key Animations to Create**:

1. `fadeIn` - opacity 0 → 1
2. `slideUp` - translateY(20px) → 0
3. `scaleIn` - scale 0.95 → 1
4. `shimmer` - loading skeleton gradient
5. `bounceIn` - success checkmark scale with bounce
6. `slideRight` - task deletion exit
7. `collapseHeight` - smooth height transition

---

## 📐 Spacing System

```
Base unit: 4px

Sizes:
- xs: 4px
- sm: 8px
- md: 12px (most common gap)
- lg: 16px (card padding)
- xl: 20px
- 2xl: 24px (section padding)
- 3xl: 32px
- 4xl: 48px (large section gaps)
```

---

## ✅ Success Criteria

### Navbar

- Consistent across all pages
- Smooth mobile hamburger animation
- User dropdown with hover state
- Search icon (if implemented) with modal

### Sidebar

- Collapse smoothly (no jank)
- Icons visible when collapsed
- Active page clearly highlighted
- User section always at bottom

### Overview Page

- Loads in < 2 seconds
- All stats accurate from database
- Schedule shows real events
- Task list sortable by column
- Empty states are friendly

### Modals

- Enter/exit feels smooth (not jarring)
- Success feedback clear and quick
- Deletion has undo option
- No layout shift on open/close

### Overall

- No half-assed implementations
- Every animation has purpose
- Consistent spacing throughout
- Accessible (keyboard navigation works)
- Mobile responsive

---

## 🎨 Design Tokens (CSS Variables)

```css
:root {
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 200ms ease-in-out;
  --transition-slow: 300ms ease-in-out;

  /* Z-index */
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-navbar: 50;
  --z-modal-backdrop: 100;
  --z-modal: 101;
  --z-tooltip: 200;
}
```

---

## 🔍 Key Details to Remember

1. **Navbar Image 1**: Clean horizontal bar with hamburger (left), page title (center), user actions (right)
2. **Sidebar Image 2**: Icon-based vertical nav, dark gradient OR light with border, collapsible
3. **Overview Image 3**: Doozy.co style - stat cards, recent tasks with priority, schedule timeline, task table
4. **Overview Image 4**: Fireart style - secondary reference for polish
5. **Credits**: Show 75 total (4 modules × 15 credits each) for user 265c42f0-477b-4878-b1b6-f204d61de18c
6. **Timetable Solution**: Smart default times + dashed border for unscheduled tasks
7. **Modal Animations**: Scale + fade, success checkmark, delete with undo, smooth and purposeful
8. **Not Over the Line**: Animations should enhance, not distract (200-300ms range, subtle effects)

---

## 🎯 Next Immediate Steps

1. Fix credits widget (query real module data, show 75)
2. Create TopNavbar component with hamburger
3. Modernize Sidebar with icon layout
4. Start Overview page hero section
5. Setup Framer Motion for animations
