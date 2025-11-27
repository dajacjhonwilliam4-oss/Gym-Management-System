# 🏋️ Coaches Module Update

## Summary
Added complete CRUD functionality to the Coaches module with an "Add Coach" button, similar to the Members module.

## Changes Made

### 1. **Frontend HTML** (`frontend/html/coaches.html`)
- ✅ Added "Add Coach" button (visible only to admins)
- ✅ Added search functionality
- ✅ Added statistics cards (Total Coaches, Active Coaches)
- ✅ Replaced static coach cards with dynamic grid
- ✅ Added modal form for adding/editing coaches

### 2. **Frontend JavaScript** (`frontend/js/coaches.js`) - NEW FILE
- ✅ Load coaches from API
- ✅ Display coaches in grid layout
- ✅ Search functionality (name, email, specialization)
- ✅ Add new coach with form validation
- ✅ Edit existing coach
- ✅ Delete coach with confirmation
- ✅ Role-based access control (admin only for add/edit/delete)
- ✅ Create login account for coaches with password

### 3. **Frontend CSS** (`frontend/css/style.css`)
- ✅ Added `.coaches-grid` for responsive grid layout
- ✅ Enhanced `.view-btn` with hover effect

## Features

### For Admins:
- **Add Coach**: Click "Add Coach" button to open modal form
- **Edit Coach**: Click "Edit" button on any coach card
- **Delete Coach**: Click "Delete" button with confirmation prompt
- **Search**: Filter coaches by name, email, or specialization

### For All Users:
- **View Coaches**: See all coaches in a card grid layout
- **Search**: Find specific coaches
- **View Statistics**: See total and active coaches count

## Coach Form Fields

### Required Fields:
- Full Name *
- Email *
- Password * (for new coaches, optional when editing)
- Phone Number *
- Specialization * (e.g., Strength Training, Yoga, Cardio)

### Optional Fields:
- Years of Experience
- Certifications
- Bio
- Status (Active/Inactive)

## Technical Details

### API Endpoints Used:
- `GET /api/coaches` - Load all coaches
- `POST /api/coaches` - Create new coach
- `PUT /api/coaches/{id}` - Update coach
- `DELETE /api/coaches/{id}` - Delete coach

### Authentication:
- Uses JWT token from localStorage
- `authenticatedFetch()` function for API calls
- Role-based UI elements (admin-only buttons)

### Responsive Design:
- Grid layout adapts to screen size
- Minimum card width: 250px
- Auto-fill columns based on available space

## How to Use

1. **Login as Admin**
   - Email: `admin@gym.com`
   - Password: `admin123456`

2. **Navigate to Coaches**
   - Click "Coaches" in the sidebar

3. **Add a Coach**
   - Click the "Add Coach" button (top right)
   - Fill in the required fields
   - Password will create a login account for the coach
   - Click "Add Coach" to save

4. **Edit a Coach**
   - Click the "Edit" button on any coach card
   - Modify the fields
   - Leave password blank to keep existing password
   - Click "Update Coach" to save

5. **Delete a Coach**
   - Click the "Delete" button on any coach card
   - Confirm the deletion

6. **Search Coaches**
   - Type in the search box
   - Results filter automatically
   - Search by name, email, or specialization

## Access

- **Coaches Page**: http://localhost:3000/coaches.html
- **API Documentation**: http://localhost:3000/swagger

## Notes

- Password must be at least 6 characters
- Email must be unique
- Coaches can login with their email and password
- Only admins can add, edit, or delete coaches
- All users can view coaches and search

---

**Implementation Date**: November 26, 2025
**Status**: ✅ Complete and Tested
