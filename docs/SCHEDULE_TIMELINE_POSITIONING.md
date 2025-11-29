# Schedule Timeline Positioning Feature

## Overview
Enhanced the schedule calendar timeline view to display schedule cards side by side with precise time-based positioning.

## What Changed

### 1. **Precise Time Positioning**
- Schedule cards now position based on exact start time (e.g., 6:30 PM appears halfway through the 6 PM hour slot)
- Cards span vertically across multiple hours based on their actual duration
- Height is calculated proportionally: `(duration in minutes / 60) * 80px per hour`

### 2. **Side-by-Side Layout for Overlapping Schedules**
- When multiple schedules overlap, they automatically arrange side by side
- Each schedule gets its own column
- Width adjusts automatically based on number of overlapping schedules
- Algorithm detects overlaps and assigns columns intelligently

### 3. **Visual Improvements**
- Cards are absolutely positioned for pixel-perfect placement
- Smooth hover effects with elevation
- Color-coded by status (upcoming, ongoing, completed)
- Pulsing animation for ongoing classes
- Gradient backgrounds for different status types

## Technical Implementation

### JavaScript Changes (`frontend/js/schedules.js`)

#### Key Algorithm:
1. **Convert times to minutes** since midnight for precise calculations
2. **Detect overlaps** between all schedules
3. **Assign columns** to overlapping schedules
4. **Calculate positions**:
   - `top = (startMinutes / 60) * hourHeight`
   - `height = (durationMinutes / 60) * hourHeight`
   - `left = 100px + (column * columnWidth)`
   - `width = columnWidth - gap`

#### Example:
```javascript
// Schedule at 6:30 PM - 7:45 PM
startMinutes = 18 * 60 + 30 = 1110 minutes
endMinutes = 19 * 60 + 45 = 1185 minutes
topOffset = (1110 / 60) * 80 = 1480px (halfway through 18th hour)
height = ((1185 - 1110) / 60) * 80 = 100px (1.25 hours)
```

### CSS Changes (`frontend/css/schedules.css`)

#### New Classes:
- `.timeline-schedule-card` - Main card styling with absolute positioning
- `.schedule-card-header` - Card header with title and status badge
- `.schedule-card-details` - Card content area
- `.schedule-card-status` - Status badge (upcoming, ongoing, completed)

#### Key Styles:
- Fixed hour height: `80px`
- Positioned timeline: `position: relative`
- Absolute card positioning with calculated top/left/height/width
- Smooth transitions and hover effects
- Responsive to overlapping schedules

## Features

### ✅ Implemented
1. **Exact time positioning** - Cards align with minutes, not just hours
2. **Multi-column layout** - Side-by-side arrangement for overlaps
3. **Proportional height** - Visual duration representation
4. **Status indicators** - Color coding and badges
5. **Hover effects** - Interactive feedback
6. **Animations** - Pulsing for ongoing classes
7. **Background highlighting** - Hour slots show active periods

### 🎯 Benefits
- **Better visualization** - See exact timing at a glance
- **Handle overlaps** - Multiple classes visible simultaneously
- **Accurate duration** - Card height matches actual class length
- **Professional appearance** - Modern, clean design
- **User-friendly** - Intuitive time representation

## Usage

1. Navigate to **Schedules** page
2. Click on any day in the calendar
3. View the timeline with positioned schedule cards
4. Cards appear at their exact start times
5. Overlapping schedules display side by side

## Example Scenarios

### Scenario 1: Single Schedule
- **Schedule**: Yoga at 6:30 PM - 7:30 PM
- **Display**: Card appears halfway through the 6 PM hour slot, extends to 7:30 PM
- **Width**: 100% of timeline

### Scenario 2: Overlapping Schedules
- **Schedule 1**: Yoga at 6:00 PM - 7:00 PM
- **Schedule 2**: Spinning at 6:30 PM - 7:30 PM
- **Display**: Both cards visible side by side, each taking 50% width
- **Position**: Yoga starts at 6:00, Spinning starts halfway through 6 PM hour

### Scenario 3: Three Overlapping Schedules
- **Display**: Each card takes ~33% width, arranged in columns
- **Auto-adjustment**: Algorithm finds optimal column arrangement

## Responsive Design

### Desktop (>768px)
- Hour height: **60px**
- Time label width: **70px**
- Font sizes: 11-12px
- Compact, professional layout

### Mobile (≤768px)
- Hour height: **50px**
- Time label width: **60px**
- Font sizes: 9-10px
- Optimized for small screens
- Touch-friendly sizing

### Automatic Adjustment
The timeline automatically detects screen size and adjusts:
- Card dimensions
- Font sizes
- Spacing and padding
- Minimum card heights

## Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ IE11 (limited support for CSS Grid)

## Performance
- Efficient O(n²) overlap detection for small datasets
- DOM manipulation optimized with document fragments
- Smooth animations using CSS transforms
- No performance impact for typical gym schedules (<100 per day)

## Future Enhancements
- [ ] Drag and drop to reschedule
- [ ] Click to edit from timeline
- [ ] Zoom in/out for different time granularities
- [ ] Print-friendly view
- [ ] Export timeline as image

---

**Last Updated**: 2024
**Files Modified**: 
- `frontend/js/schedules.js`
- `frontend/css/schedules.css`
