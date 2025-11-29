# 📚 Class Enrollment Feature

## Overview
Members can now enroll in (join) and unenroll from (leave) scheduled classes. The system tracks enrollment count and enforces capacity limits.

---

## 🎯 Features

### For Members (with Coach Subscription)
1. **Join Classes** - Enroll in upcoming or ongoing classes
2. **Leave Classes** - Unenroll from classes before they start
3. **View Enrollment Status** - See if they're enrolled in a class
4. **Capacity Tracking** - See how many spots are available
5. **Any Coach Classes** - Can join classes from any coach, not just their assigned coach

### Restrictions
- ❌ Cannot enroll in **past/completed** classes
- ❌ Cannot enroll in **full** classes (capacity reached)
- ❌ Cannot enroll **twice** in the same class
- ✅ Only **members** can enroll (not coaches or admins)

---

## 🔧 Technical Implementation

### Backend (C# API)

#### New Endpoints

**Enroll in Class**
```
POST /api/schedules/{id}/enroll
Body: { "userId": "user_id" }
```

**Unenroll from Class**
```
POST /api/schedules/{id}/unenroll
Body: { "userId": "user_id" }
```

#### Validations
1. **Already Enrolled Check** - Prevents duplicate enrollment
2. **Capacity Check** - Blocks enrollment if class is full
3. **Past Class Check** - Prevents enrollment in completed classes
4. **Enrollment Status Check** - Only allows unenroll if enrolled

#### Files Modified
- `GymManagementAPI/Controllers/SchedulesController.cs` - Added enroll/unenroll endpoints
- `GymManagementAPI/Models/Schedule.cs` - Already had `EnrolledMembers` list

---

### Frontend (JavaScript)

#### UI Changes

**Timeline View Cards**
- Shows enrollment count: `5/10 enrolled` or `5 enrolled` (if no capacity limit)
- **Join Class** button (green) - For non-enrolled members
- **Leave Class** button (red) - For enrolled members
- **Class Full** button (gray, disabled) - When capacity reached
- Buttons only visible for members on upcoming/ongoing classes

**Table View**
- Capacity column now shows: `5/10` or `5` (enrolled/capacity)

**Calendar Pills**
- Still compact, shows class names and times

#### Functions Added
```javascript
enrollInClass(scheduleId)    // Enroll member in class
unenrollFromClass(scheduleId) // Remove member from class
```

#### Files Modified
- `frontend/js/schedules.js` - Added enrollment logic and UI updates

---

## 📊 User Experience

### Member Flow

#### Enrolling in a Class
1. Navigate to **Schedules** page
2. Click on a day in the calendar
3. See timeline with schedule cards
4. Find a class and click **"Join Class"** button
5. Alert: "Successfully enrolled in class!"
6. Button changes to **"Leave Class"**
7. Enrolled count updates: `5/10` → `6/10`

#### Leaving a Class
1. Click **"Leave Class"** button on an enrolled class
2. Confirm: "Are you sure you want to leave this class?"
3. Click OK
4. Alert: "Successfully left the class"
5. Button changes to **"Join Class"**
6. Enrolled count updates: `6/10` → `5/10`

#### When Class is Full
- Button shows **"Class Full"** (disabled, gray)
- Cannot enroll
- Must wait for someone to leave or admin to increase capacity

---

## 💾 Data Structure

### Schedule Model
```csharp
public class Schedule
{
    public string Id { get; set; }
    public string ClassName { get; set; }
    public string CoachId { get; set; }
    public string Date { get; set; }
    public string StartTime { get; set; }
    public string EndTime { get; set; }
    public int? Capacity { get; set; }
    public string Description { get; set; }
    public List<string> EnrolledMembers { get; set; } = new(); // User IDs
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### Enrollment Request
```csharp
public class EnrollRequest
{
    public string UserId { get; set; }
}
```

---

## 🎨 Visual Design

### Button Styles

**Join Class Button** (Green)
```css
background: #4CAF50;
color: white;
padding: 4px 8px;
border-radius: 4px;
font-size: 10px;
```

**Leave Class Button** (Red)
```css
background: #e74c3c;
color: white;
padding: 4px 8px;
border-radius: 4px;
font-size: 10px;
```

**Class Full Button** (Gray, Disabled)
```css
background: #95a5a6;
color: white;
padding: 4px 8px;
border-radius: 4px;
font-size: 10px;
cursor: not-allowed;
```

---

## 🔐 Security & Permissions

### Role-Based Access
| Role | Can Enroll | Can Unenroll | Can View Count |
|------|-----------|-------------|---------------|
| **Member** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Coach** | ❌ No | ❌ No | ✅ Yes |
| **Admin** | ❌ No | ❌ No | ✅ Yes |

### API Security
- All endpoints require authentication
- UserId is extracted from authenticated user
- Cannot enroll/unenroll other users
- Admin can see all enrollments but cannot enroll

---

## 📈 Use Cases

### Use Case 1: Member Joins a Class
**Scenario**: Sarah wants to join a Yoga class

1. Sarah logs in as member
2. Goes to Schedules page
3. Clicks on November 27
4. Sees "Yoga - 9:00 AM" with "3/10 enrolled"
5. Clicks "Join Class"
6. Success! Now shows "4/10 enrolled" and "Leave Class" button

### Use Case 2: Class Reaches Capacity
**Scenario**: Popular Spinning class fills up

1. Spinning class has capacity of 5
2. 5 members enroll (5/5 enrolled)
3. 6th member tries to join
4. Button shows "Class Full" (disabled)
5. Cannot enroll
6. When someone leaves, button becomes "Join Class" again

### Use Case 3: Member Changes Mind
**Scenario**: John enrolls but needs to cancel

1. John enrolled in CrossFit class (shows "Leave Class")
2. Clicks "Leave Class"
3. Confirms: "Are you sure?"
4. Successfully unenrolled
5. Enrollment count decreases
6. Button changes to "Join Class"

---

## 🚀 Future Enhancements

- [ ] **Waitlist** - Allow members to join waitlist when class is full
- [ ] **Email Notifications** - Notify members when enrolled/unenrolled
- [ ] **Calendar Integration** - Add to Google Calendar
- [ ] **Enrollment History** - Track member's class attendance
- [ ] **Recurring Enrollment** - Auto-enroll in recurring classes
- [ ] **Cancellation Policy** - Minimum hours before class to cancel
- [ ] **Check-in System** - Mark attendance when class starts
- [ ] **Credits System** - Deduct credits when enrolling

---

## 🧪 Testing

### Test Scenarios

1. **✅ Enroll in upcoming class** - Should succeed
2. **✅ Enroll in ongoing class** - Should succeed
3. **❌ Enroll in past class** - Should fail
4. **❌ Enroll when full** - Should fail
5. **❌ Enroll twice** - Should fail
6. **✅ Unenroll from enrolled class** - Should succeed
7. **❌ Unenroll when not enrolled** - Should fail
8. **✅ View enrollment count** - Should display correctly
9. **✅ Multiple members enroll** - Count should increment
10. **✅ Member leaves, count decreases** - Should update

### Manual Testing Steps

1. Login as member (test@gmail.com / member123)
2. Go to Schedules page
3. Click on a day with schedules
4. Try joining a class
5. Verify enrollment count updates
6. Try leaving the class
7. Verify count decreases
8. Try joining a full class (should be blocked)
9. Try joining as coach/admin (no buttons should show)

---

## 📝 Database Impact

### Before
```json
{
  "_id": "schedule_id",
  "className": "Yoga",
  "capacity": 10,
  "enrolledMembers": []
}
```

### After Enrollment
```json
{
  "_id": "schedule_id",
  "className": "Yoga",
  "capacity": 10,
  "enrolledMembers": [
    "user_id_1",
    "user_id_2",
    "user_id_3"
  ]
}
```

---

## 🎓 Benefits

### For Members
- 📅 Easy class booking
- 👀 See availability at a glance
- 🔄 Flexible enrollment/unenrollment
- 🏋️ Join any coach's classes

### For Gym
- 📊 Track class popularity
- 🎯 Optimize class capacity
- 📈 Better resource planning
- 💰 Potential for premium bookings

### For Coaches
- 👥 See who's attending
- 📉 Monitor class fill rates
- 🎯 Plan accordingly

---

**Status**: ✅ Complete and Ready to Use
**Version**: 1.0
**Date**: 2024
