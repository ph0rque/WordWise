# Fixing Session Timeout Issues in WordWise

## 🔍 Problem
Users are experiencing quick session timeouts, requiring frequent re-authentication.

## 🛠️ Solution Options

### Option 1: Increase JWT Expiry in Supabase (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/projects
   - Select your WordWise project

2. **Navigate to Settings**
   - Click "Settings" in the left sidebar
   - Click "API" in the settings menu

3. **Find JWT Settings**
   - Scroll down to "JWT Settings" section
   - Look for "JWT expiry limit"

4. **Increase the Expiry Time**
   - **Current**: Probably 3600 seconds (1 hour)
   - **Recommended**: 86400 seconds (24 hours)
   - **For longer sessions**: 604800 seconds (7 days)

5. **Save Changes**
   - Click "Save" to apply the new settings
   - Changes take effect immediately

### Option 2: Code-Based Token Refresh (Already Implemented)

The application now includes:
- ✅ **Automatic token refresh** every 50 minutes
- ✅ **Enhanced auth event handling** for TOKEN_REFRESHED events
- ✅ **Better session management** with proper cleanup

## 🧪 Testing the Fix

After applying the Supabase settings change:

1. **Sign in to WordWise**
2. **Leave the application open** for the JWT expiry time
3. **Try to interact** with documents or other features
4. **Check browser console** for refresh messages:
   - `🔄 Token refreshed successfully`
   - `🔄 Session refreshed automatically`

## 📊 Session Duration Options

| Duration | Seconds | Use Case |
|----------|---------|----------|
| 1 hour   | 3600    | High security (default) |
| 8 hours  | 28800   | Work day sessions |
| 24 hours | 86400   | Daily sessions (recommended) |
| 7 days   | 604800  | Weekly sessions |
| 30 days  | 2592000 | Monthly sessions |

## 🔒 Security Considerations

- **Shorter sessions** = Higher security, more user friction
- **Longer sessions** = Better UX, slightly lower security
- **24 hours** is a good balance for most educational applications
- **Automatic refresh** provides seamless experience

## 🚨 Troubleshooting

If sessions still timeout quickly:

1. **Check browser console** for refresh errors
2. **Verify JWT settings** were saved in Supabase
3. **Clear browser cache** and cookies
4. **Check if refresh tokens** are being rotated properly

## 📝 Additional Settings

In Supabase Settings → Auth, you can also adjust:
- **Refresh token rotation**: Whether refresh tokens change on use
- **Refresh token reuse interval**: How long old refresh tokens remain valid
- **Session timeout**: Additional session timeout settings 