# Login Button Troubleshooting

## Issue: Login Button Not Showing on Landing Page

### Quick Fix:
The login button is likely hidden because your browser has an old session cookie. Try one of these:

1. **Clear Browser Cookies** (Fastest):
   - Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
   - Select "Cookies and other site data"
   - Clear data

2. **Use Incognito/Private Window**:
   - `Ctrl + Shift + N` (Chrome) or `Ctrl + Shift + P` (Firefox)
   - Navigate to `http://localhost:8080`

3. **Clear Session via DevTools**:
   - Press `F12` to open DevTools
   - Go to **Application** tab
   - Under **Storage** → **Cookies** → `http://localhost:8080`
   - Delete the `connect.sid` cookie
   - Refresh the page

4. **Manual Logout**:
   - Open browser console (`F12`)
   - Run: 
   ```javascript
   fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
     .then(() => location.reload())
   ```

### How to Verify the Button is Working:
After clearing cookies, you should see:
- **When logged out**: "Login" button at the top-right (white border, hollow button)
- **When logged in as client**: "Account" dropdown with user icon

### Technical Details:
- Button location: Top-right corner of the header
- Color: White text with white/40% opacity border
- Responsive: Shows "Login" text on small screens+, User icon on mobile
- File: `client/components/Header.tsx` lines 207-228
