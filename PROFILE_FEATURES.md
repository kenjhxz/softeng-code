# Profile Dropdown and Notification Features

This document describes the profile management and notification features implemented in this PR.

## Overview

This PR combines features from two separate branches to create a comprehensive profile and notification system with:
- Profile dropdown menu with separate View Profile and Manage Account pages
- Notification bell with dropdown and real-time polling
- Profile image upload functionality
- Role switching with cooldown protection
- Dashboard card filtering
- Search functionality

## Features Implemented

### 1. Profile Dropdown Menu

**Location:** Header (when logged in)

**Components:**
- Clickable profile trigger showing avatar, name, and role
- Dropdown menu with:
  - View Profile (with user icon)
  - Manage Account (with settings icon)
  - Logout (with sign-out icon)

**Behavior:**
- Click profile area to toggle dropdown
- Click outside dropdown to close
- Navigation to separate page sections (not modals)

### 2. View Profile Page

**Route:** `#view-profile` section

**Features:**
- Gradient header with large profile avatar
- User information display:
  - Full Name
  - Email
  - Role (with badge)
  - Location
  - Account Status
- "Manage Account" button to navigate to settings

**Access:**
- Click "View Profile" in dropdown menu
- Click "Manage Account" button from View Profile page

### 3. Manage Account Page

**Route:** `#manage-account` section

**Sections:**

#### a. Update Profile
- Update name and location
- Save button to persist changes
- Updates reflected across all UI elements

#### b. Change Password
- Current password verification
- New password with confirmation
- Minimum 6 characters validation
- Secure password change process

#### c. Profile Image Upload
- Image file selection
- Preview before upload
- 2MB file size limit
- Supported formats: JPG, PNG, GIF
- Base64 encoding for storage
- Image displayed in header and profile pages

#### d. Switch Role
- Toggle between Requester and Volunteer roles
- 24-hour cooldown between switches
- Countdown display showing remaining time
- Automatic navigation to appropriate dashboard after switch
- Role information updated everywhere

### 4. Notification System

**Location:** Header (bell icon, when logged in)

**Features:**
- Notification bell icon with unread count badge
- Dropdown showing recent notifications
- Click notification to mark as read
- 30-second automatic polling for new notifications
- Unread notifications highlighted with blue background

**Behavior:**
- Badge shows when unread notifications exist
- Badge disappears when all notifications are read
- Notifications sorted by date (newest first)
- Polling continues while user is logged in
- Polling stops on logout

### 5. Search Functionality

**Location:** Home page search bar

**Features:**
- Real-time filtering as user types
- Searches across:
  - Request titles
  - Request descriptions
  - Categories
  - Locations
- Case-insensitive search
- Results update dynamically

### 6. Dashboard Card Filtering

**Location:** Requester and Volunteer dashboards

**Features:**
- Three clickable stat cards:
  - Active Requests/Offers
  - Pending Offers
  - Completed Requests
- Click card to filter content below
- Visual active state (border and checkmark)
- Hover effects for better UX

### 7. Urgent Request Timer

**Location:** Request cards with "urgent" priority

**Features:**
- Clock icon with "Urgent Request" label
- Visual indicator for time-sensitive requests
- Prepared for future countdown timer implementation

## Backend API Endpoints

### Authentication & Profile
- `GET /api/auth/me` - Get current user with profile_image and last_role_switch
- `PUT /api/auth/profile` - Update user profile (name, location)
- `PUT /api/auth/password` - Change password with validation

### User Management
- `POST /api/user/profile-image` - Upload profile image (base64, 2MB limit)
- `POST /api/user/switch-role` - Switch role with 24-hour cooldown validation

### Notifications
- `GET /api/notifications` - Get user notifications (20 most recent)
- `GET /api/notifications/unread-count` - Get unread notification count
- `PATCH /api/notifications/:id/read` - Mark notification as read

## Database Schema Changes

### Users Table
```sql
ALTER TABLE users ADD COLUMN profile_image LONGTEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN last_role_switch DATETIME DEFAULT NULL;
```

### Requests Table
```sql
ALTER TABLE requests ADD COLUMN urgent_timer_start DATETIME DEFAULT NULL;
```

## Security Considerations

### Implemented Security Measures
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Session-based authentication
- ✅ Input validation for all form submissions
- ✅ Role-based access control
- ✅ Profile image size validation (2MB)
- ✅ SQL injection protection (parameterized queries)
- ✅ Password confirmation validation
- ✅ Cooldown mechanism for role switching

### Known Security Issues (Pre-existing)
- ⚠️ Missing rate limiting on API endpoints
- ⚠️ Missing CSRF protection
- 📝 These issues affect the entire application and should be addressed in a dedicated security PR

**Recommendations:**
1. Implement rate limiting using `express-rate-limit`
2. Add CSRF protection using `csurf` middleware
3. Consider adding account lockout after failed login attempts
4. Implement password strength requirements
5. Add email verification for sensitive operations

## Usage Instructions

### For Users

#### Viewing Your Profile
1. Click your profile area in the header
2. Select "View Profile" from the dropdown
3. View your profile information
4. Click "Manage Account" to edit settings

#### Updating Your Profile
1. Navigate to Manage Account
2. Update your name and/or location
3. Click "Save Changes"

#### Changing Your Password
1. Navigate to Manage Account
2. Scroll to "Change Password" section
3. Enter current password
4. Enter and confirm new password (min 6 chars)
5. Click "Update Password"

#### Uploading a Profile Picture
1. Navigate to Manage Account
2. Scroll to "Profile Image" section
3. Click "Choose Image"
4. Select an image file (max 2MB)
5. Preview the image
6. Click "Upload" to save

#### Switching Roles
1. Navigate to Manage Account
2. Scroll to "Switch Role" section
3. Check cooldown status
4. Click "Switch to [Role]" button
5. Confirm the action
6. You'll be redirected to the appropriate dashboard

#### Viewing Notifications
1. Click the bell icon in the header
2. View your recent notifications
3. Click any notification to mark it as read
4. Badge shows count of unread notifications

### For Developers

#### Starting the Application
```bash
# Install dependencies
npm install

# Initialize database (if not already done)
npm run init-db

# Start the server
npm start
```

#### Testing Profile Features
1. Login as a test user
2. Navigate to View Profile or Manage Account
3. Test each feature individually
4. Verify changes persist across sessions

#### Notification Polling
- Polling starts automatically on login
- Interval: 30 seconds
- Stops automatically on logout
- Check browser console for polling activity

## Technical Details

### Frontend Architecture
- **HTML:** Single-page application with section-based navigation
- **CSS:** Component-based styling with CSS custom properties
- **JavaScript:** Vanilla JS with async/await for API calls

### State Management
- Current user stored in `currentUser` global variable
- Profile updates immediately reflected in UI
- Session data fetched from server on page load

### Image Handling
- Images converted to base64 for storage
- Stored directly in database (LONGTEXT column)
- Size validation before upload (2MB limit)
- Preview functionality using FileReader API

### Notification Polling
- `setInterval` for 30-second polling
- Fetches unread count from server
- Updates badge dynamically
- Cleans up interval on logout

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note:** The application uses modern JavaScript features (async/await, arrow functions) and CSS features (custom properties, grid, flexbox). IE11 is not supported.

## Mobile Responsiveness

All features are fully responsive and work on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

Dropdowns automatically adjust position based on viewport.

## Troubleshooting

### Profile image not showing
- Check file size (must be < 2MB)
- Verify file format (JPG, PNG, GIF only)
- Check browser console for errors

### Role switch not working
- Verify 24-hour cooldown has passed
- Check server logs for errors
- Ensure you're logged in

### Notifications not updating
- Check browser console for polling errors
- Verify server is running
- Check network tab for failed requests

### Search not filtering
- Clear the search input and try again
- Check that requests are loaded
- Verify JavaScript is enabled

## Future Enhancements

1. **Email notifications** for important events
2. **Profile image cropping** tool
3. **Bio/About Me** section
4. **Social media links** in profile
5. **Activity log** of recent actions
6. **2FA** for enhanced security
7. **Password strength meter**
8. **Real-time notifications** using WebSockets
9. **Notification preferences** settings
10. **Profile visibility** controls

## Contributing

When contributing to these features:
1. Maintain the existing code style
2. Test all changes thoroughly
3. Update this documentation
4. Consider security implications
5. Ensure mobile responsiveness

## License

Same as the main project license.
