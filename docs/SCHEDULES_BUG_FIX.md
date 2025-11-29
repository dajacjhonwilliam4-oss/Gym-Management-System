# Schedules Module - Bug Fix

## Issue
When loading the schedules page, the following JavaScript errors occurred:
```
Uncaught SyntaxError: Identifier 'userStr' has already been declared
Uncaught ReferenceError: switchView is not defined
```

## Root Cause
In the `editSchedule()` function (lines 450-451), the variables `userStr` and `currentUser` were declared twice:
1. First declaration at lines 420-421 (for admin role check)
2. Second declaration at lines 450-451 (for coach dropdown visibility)

This caused a JavaScript error that prevented the entire script from loading, which then caused the `switchView` function to be undefined.

## Solution
Removed the duplicate variable declarations at lines 450-451 in the `editSchedule()` function. Since `userStr` and `currentUser` were already declared at the beginning of the function, they can be reused for the coach dropdown visibility check.

## Changes Made

### File: `frontend/js/schedules.js`

**Before:**
```javascript
async function editSchedule(id) {
    // Check user role - only admins can edit schedules
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    
    if (!currentUser || currentUser.role !== 'admin') {
        showMessage('Only administrators can edit schedules', 'error');
        return;
    }
    
    // ... schedule loading code ...
    
    // Handle coach dropdown visibility based on user role
    const userStr = localStorage.getItem('user');  // ❌ DUPLICATE
    const currentUser = userStr ? JSON.parse(userStr) : null;  // ❌ DUPLICATE
    const coachFormGroup = document.getElementById('coachId').closest('.form-group');
    
    // ... rest of code ...
}
```

**After:**
```javascript
async function editSchedule(id) {
    // Check user role - only admins can edit schedules
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    
    if (!currentUser || currentUser.role !== 'admin') {
        showMessage('Only administrators can edit schedules', 'error');
        return;
    }
    
    // ... schedule loading code ...
    
    // Handle coach dropdown visibility based on user role
    const coachFormGroup = document.getElementById('coachId').closest('.form-group');  // ✅ FIXED
    
    // ... rest of code (reuses userStr and currentUser from above) ...
}
```

## Verification
- ✅ JavaScript syntax validation passed: `node -c frontend/js/schedules.js`
- ✅ No duplicate variable declarations
- ✅ All functions are properly defined

## Testing
1. Navigate to http://localhost:3000/schedules.html
2. Verify no console errors appear
3. Test switching between Table and Calendar views
4. Test creating, editing, and deleting schedules (with appropriate permissions)
5. Verify date picker only allows future dates
6. Verify coach names appear in calendar view

## Date
2024-11-28
