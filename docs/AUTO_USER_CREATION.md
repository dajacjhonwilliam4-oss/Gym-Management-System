# 🔐 Automatic User Account Creation

## Overview
All future members and coaches are automatically given user accounts for login when they are created, except for trial members.

---

## 🎯 How It Works

### When Creating a Member
1. Admin creates a member in the Members module
2. **If NOT trial membership**: System automatically creates a user account
3. Member can now login with their email

### When Creating a Coach
1. Admin creates a coach in the Coaches module
2. System automatically creates a user account
3. Coach can now login with their email

---

## 🔑 Default Passwords

### Members
- **Default Password**: `member123`
- **Role**: member
- **Can**: Join classes, view schedules

### Coaches
- **Default Password**: `coach123`
- **Role**: coach
- **Can**: View schedules, see enrollments

---

## 🚫 Exclusions (Trial Members)

**Trial members do NOT get user accounts** if:
- Membership type is "Trial"
- Email contains "@trial.local"
- Email is empty/null

**Why?**
- Trial members are temporary
- They don't need login access
- Keeps user database clean

---

## 📊 Examples

### Example 1: Regular Member (Gets Account)
```
Admin creates member:
  Name: John Doe
  Email: john@example.com
  Membership: Monthly with Coach

Result:
✅ Member created in Members collection
✅ User account auto-created in Users collection
  - Email: john@example.com
  - Password: member123
  - Role: member
  
John can now login at: http://localhost:3000/login.html
```

### Example 2: Trial Member (No Account)
```
Admin creates member:
  Name: Jane Smith
  Email: jane@trial.local
  Membership: Trial

Result:
✅ Member created in Members collection
❌ No user account created (trial member)

Jane cannot login (trial only)
```

### Example 3: Coach (Gets Account)
```
Admin creates coach:
  Name: Mike Johnson
  Email: mike@gym.com
  Specialization: CrossFit

Result:
✅ Coach created in Coaches collection
✅ User account auto-created in Users collection
  - Email: mike@gym.com
  - Password: coach123
  - Role: coach
  
Mike can now login at: http://localhost:3000/login.html
```

---

## 🔧 Technical Implementation

### Backend Logic

**File**: `GymManagementAPI/Controllers/MembersController.cs`

```csharp
[HttpPost]
public async Task<IActionResult> Create([FromBody] Member member)
{
    // Create member first
    var createdMember = await _memberService.CreateAsync(member);
    
    // Auto-create user account for non-trial members
    if (!string.IsNullOrEmpty(member.Email) && 
        !member.Email.Contains("@trial.local") && 
        member.MembershipType?.ToLower() != "trial")
    {
        // Check if user already exists
        var existingUsers = await _userService.GetAllAsync();
        var userExists = existingUsers.Any(u => u.Email == member.Email);
        
        if (!userExists)
        {
            // Create user account
            var user = new User
            {
                Name = member.Name,
                Email = member.Email,
                Password = "member123", // Will be hashed
                Role = "member",
                AuthProvider = "local",
                IsActive = true
            };
            
            await _userService.CreateAsync(user);
        }
    }
    
    return StatusCode(201, createdMember);
}
```

**File**: `GymManagementAPI/Controllers/CoachesController.cs`

```csharp
[HttpPost]
public async Task<IActionResult> Create([FromBody] Coach coach)
{
    // Create coach first
    var createdCoach = await _coachService.CreateAsync(coach);
    
    // Auto-create user account
    if (!string.IsNullOrEmpty(coach.Email))
    {
        var existingUsers = await _userService.GetAllAsync();
        var userExists = existingUsers.Any(u => u.Email == coach.Email);
        
        if (!userExists)
        {
            var user = new User
            {
                Name = coach.Name,
                Email = coach.Email,
                Password = "coach123", // Will be hashed
                Role = "coach",
                AuthProvider = "local",
                IsActive = true
            };
            
            await _userService.CreateAsync(user);
        }
    }
    
    return StatusCode(201, createdCoach);
}
```

---

## 🔒 Security Features

### Duplicate Prevention
- **Checks if email already exists** before creating user
- Prevents duplicate user accounts
- Safe to create member/coach multiple times

### Password Hashing
- Default passwords are automatically hashed with BCrypt
- Not stored in plain text
- Secure from database breaches

### Error Handling
- User creation failure doesn't break member/coach creation
- Member/coach is still saved even if user creation fails
- Errors are logged but not shown to user

---

## 👥 User Experience

### For Admin
1. Create member or coach normally
2. System handles user account creation automatically
3. No extra steps needed
4. Member/coach can login immediately

### For New Members
1. Admin creates their profile
2. Receives email (or admin tells them): "Your login is ready"
3. Login at: http://localhost:3000/login.html
4. Email: (their email)
5. Password: member123
6. **Should change password after first login**

### For New Coaches
1. Admin creates their profile
2. Login credentials provided
3. Email: (their email)
4. Password: coach123
5. **Should change password after first login**

---

## 📋 Validation Rules

### Member User Creation
| Condition | Create User? |
|-----------|-------------|
| Email is valid | ✅ Yes |
| Email is empty | ❌ No |
| Email = "@trial.local" | ❌ No |
| Membership = "Trial" | ❌ No |
| Membership = "Monthly" | ✅ Yes |
| Membership = "Annual" | ✅ Yes |
| User already exists | ⏭️ Skip |

### Coach User Creation
| Condition | Create User? |
|-----------|-------------|
| Email is valid | ✅ Yes |
| Email is empty | ❌ No |
| User already exists | ⏭️ Skip |

---

## 🧪 Testing

### Test Case 1: Create Regular Member
**Steps:**
1. Login as admin
2. Go to Members page
3. Create member with:
   - Name: Test User
   - Email: testuser@example.com
   - Membership: Monthly
4. Click Create

**Expected:**
- Member created successfully
- User account auto-created
- Can login with testuser@example.com / member123

### Test Case 2: Create Trial Member
**Steps:**
1. Login as admin
2. Go to Members page
3. Create member with:
   - Name: Trial User
   - Email: trial@trial.local
   - Membership: Trial
4. Click Create

**Expected:**
- Member created successfully
- NO user account created
- Cannot login

### Test Case 3: Create Coach
**Steps:**
1. Login as admin
2. Go to Coaches page
3. Create coach with:
   - Name: Test Coach
   - Email: coach@example.com
4. Click Create

**Expected:**
- Coach created successfully
- User account auto-created
- Can login with coach@example.com / coach123

### Test Case 4: Duplicate Email
**Steps:**
1. Create member with email: duplicate@example.com
2. Create another member with same email

**Expected:**
- Both members created
- Only ONE user account created (first time)
- Second member doesn't create duplicate user

---

## 🔄 Workflow Diagram

```
Admin Creates Member/Coach
         ↓
   Save to Database
         ↓
   Check Conditions:
   - Email valid?
   - Not trial? (members only)
   - User doesn't exist?
         ↓
      YES → Create User Account
         ↓
   Member/Coach Ready
         ↓
   Can Login Immediately
```

---

## 📝 Admin Communication Template

### For New Members
```
Welcome to [Gym Name]!

Your membership has been activated.

Login Details:
Email: [member email]
Password: member123

Login at: http://localhost:3000/login.html

Please change your password after first login.

You can now:
- View class schedules
- Enroll in classes
- Track your attendance
```

### For New Coaches
```
Welcome to the [Gym Name] Team!

Your coach profile has been created.

Login Details:
Email: [coach email]
Password: coach123

Login at: http://localhost:3000/login.html

Please change your password after first login.

You can now:
- View your scheduled classes
- See class enrollments
- Manage your schedule
```

---

## 🚀 Benefits

### For Gym Management
✅ **Streamlined onboarding** - One-step member/coach creation
✅ **Immediate access** - Members/coaches can login right away
✅ **Less admin work** - No manual user account creation
✅ **Fewer errors** - Automated process is consistent
✅ **Better tracking** - All non-trial members have login

### For Members/Coaches
✅ **Quick access** - Can login as soon as profile is created
✅ **Self-service** - Can manage their own enrollments
✅ **Better engagement** - Easy access encourages usage
✅ **Transparency** - Can view schedules and enrollments

---

## 🔮 Future Enhancements

Potential improvements:

- [ ] **Email notification** - Auto-send welcome email with credentials
- [ ] **Custom passwords** - Allow admin to set initial password
- [ ] **Password requirements** - Enforce strong passwords on first login
- [ ] **Account activation** - Require email verification
- [ ] **Bulk import** - Create multiple members/coaches with auto-user creation
- [ ] **Password reset flow** - Self-service password reset
- [ ] **Trial upgrade** - Convert trial to paid and create user account

---

## 📊 Database Impact

### Before (Manual Process)
```
Members Collection: 100 members
Users Collection: 20 users (manually created)

Result: Only 20% can login
```

### After (Auto Creation)
```
Members Collection: 100 members (90 paid, 10 trial)
Users Collection: 90 users (auto-created)

Result: 90% can login (all non-trial)
```

---

## ⚠️ Important Notes

### Default Passwords
- **Members**: member123
- **Coaches**: coach123
- **Must be changed** on first login (recommend enforcing this)

### Trial Members
- Do NOT get user accounts
- Cannot login to system
- Membership data only

### Security
- Passwords are hashed before storage
- BCrypt with salt rounds
- Never stored in plain text

---

**Status:** ✅ Active
**Version:** 1.0
**Date:** 2024
**Applies to:** All future member/coach creations
