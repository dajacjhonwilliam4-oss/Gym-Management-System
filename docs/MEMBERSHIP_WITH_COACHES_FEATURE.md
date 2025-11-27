# 🎯 Membership with Coaches Feature

## Overview
This feature adds two new membership types that include personal coach assignment with automatic workflow for member registration.

## New Membership Types

### 1. **Monthly with Coach** (30 days)
- Full registration required (name, email, phone, password, address)
- Coach selection required
- Expiration: 30 days from join date
- Suggested price: $100.00

### 2. **Annual with Coach** (365 days)
- Full registration required (name, email, phone, password, address)
- Coach selection required
- Expiration: 365 days from join date
- Suggested price: $1000.00

## Workflow

### For Memberships WITHOUT Coach:
1. Admin fills member information
2. Member is created
3. **Payment dialog appears**
4. Admin processes payment

### For Memberships WITH Coach:
1. Admin fills member information
2. Member is created
3. **Choose Coach dialog appears**
   - Shows all available coaches with:
     - Coach photo
     - Name and specialty
     - Bio
     - Certifications
     - Schedule
4. Admin selects a coach
5. Coach is automatically assigned to member
6. **Payment dialog appears**
7. Admin processes payment

## Features Implemented

### Database Changes
- **Member Model**: Added `coachId` and `coachName` fields
- Automatic expiration date calculation based on membership type
- Auto-update status to "expired" when expiration date passes

### UI Updates
- **Members Table**: Added "Coach" column
- **Add Member Form**: 
  - Two new membership type options
  - Dynamic form fields based on selection
  - Color-coded hints for each membership type
- **Coach Selection Modal**:
  - Grid layout showing all coaches
  - Detailed coach information cards
  - Hover effects and smooth animations
  - Click to select coach
- **Payment Modal**: 
  - Shows assigned coach name
  - Different suggested amounts for each membership type

### Automatic Status Management
- Status automatically changes to "expired" after:
  - **Trial**: 1 day
  - **Monthly**: 30 days
  - **Annual**: 365 days
  - **Monthly with Coach**: 30 days
  - **Annual with Coach**: 365 days

### Search Functionality
- Members can now be searched by coach name
- Search includes: name, email, phone, membership type, coach name

## Technical Implementation

### Backend (C#)
- `Member.cs`: Added coach fields with MongoDB attributes
- Full backward compatibility with existing members

### Frontend (JavaScript)
- `members.js`: 
  - Coach selection workflow
  - Payment workflow routing
  - Dynamic coach loading and display
  - Coach assignment API calls

### Frontend (HTML)
- `members.html`:
  - Coach selection modal
  - Updated payment modal
  - Added coach column in members table

### Frontend (CSS)
- `members.css`:
  - Coach card styles
  - Coach selection modal styles
  - New badge colors for coach memberships
  - Hover effects and animations

## Usage Instructions

### For Admins:

1. **Navigate to Members page**
2. **Click "Add Member"**
3. **Select Membership Type**:
   - Choose "Monthly with Coach" or "Annual with Coach"
4. **Fill Required Information**:
   - Name (required)
   - Email (required)
   - Phone (required)
   - Password (required - creates login account)
   - Address (required)
   - Emergency Contact (optional)
5. **Click "Add Member"**
6. **Select a Coach**:
   - Review coach information
   - Click on a coach card to select
7. **Process Payment**:
   - Verify suggested amount or enter custom amount
   - Select payment method
   - Add notes (optional)
   - Click "Process Payment" or "Skip"

### Member Status Display:
- **Active**: Green badge - membership is valid
- **Expired**: Red badge - expiration date has passed
- Expiration date shown in table

## Price Structure

| Membership Type | Duration | Coach Included | Suggested Price |
|----------------|----------|----------------|----------------|
| Trial | 1 day | No | Free |
| Monthly | 30 days | No | $50.00 |
| Annual | 365 days | No | $500.00 |
| Monthly with Coach | 30 days | Yes | $100.00 |
| Annual with Coach | 365 days | Yes | $1000.00 |

## Benefits

### For Gym Owners:
- ✅ Streamlined member registration process
- ✅ Automatic coach assignment tracking
- ✅ Clear membership pricing structure
- ✅ Automatic expiration tracking
- ✅ Better coach utilization management

### For Members:
- ✅ Personal coach assignment
- ✅ Clear expiration dates
- ✅ Professional coach information visible

### For Coaches:
- ✅ Assigned members tracked
- ✅ Schedule and certifications displayed to potential members
- ✅ Professional profile showcase

## Future Enhancements (Suggested)
- Member can view their assigned coach profile
- Coach dashboard showing all assigned members
- Email notifications before membership expiration
- Automatic renewal process
- Coach availability calendar
- Member-coach messaging system
- Workout plan management by coach
- Progress tracking by coach

## Testing

✅ All pages load successfully (200 OK)
✅ Build successful with 0 errors, 0 warnings
✅ Database model updated
✅ Backward compatible with existing members
✅ Coach assignment workflow tested
✅ Payment workflow tested

## Files Modified

- `GymManagementAPI/Models/Member.cs`
- `frontend/html/members.html`
- `frontend/js/members.js`
- `frontend/css/members.css`
- `docs/MEMBERSHIP_WITH_COACHES_FEATURE.md` (new)
