# Debug Session: facebook-login-exchange [OPEN]

## Problem Description
- **Symptom**: User clicks Facebook login → Facebook shows "Continue as Zhixin" → After clicking continue, shows "登录失败 / 未更换Facebook授权码"
- **Expected**: Should successfully log in and redirect to dashboard
- **URL pattern**: `https://getmailforge.top/auth/callback?code=AQI...`

## Reproduction Steps
1. Go to https://getmailforge.top/login
2. Click "Continue with Facebook"
3. Facebook shows confirmation dialog → Click "Continue as [user]"
4. Page redirects to `/auth/callback?code=...` → Shows "登录失败"

## Hypotheses
1. **redirectUri mismatch**: The redirectUri used in the OAuth request differs from the one used in the token exchange
2. **Authorization code expired**: Facebook code expires very quickly (~5 min), or is being double-used
3. **App ID / Secret mismatch**: The wrong app credentials are being used during the token exchange
4. **State validation failure**: The state parameter comparison is failing due to encoding issues
5. **Network/API failure**: The token exchange request to Facebook API is failing silently

## Status
- [x] Hypotheses listed
- [ ] Instrumentation added
- [ ] Evidence collected
- [ ] Root cause confirmed
- [ ] Fix applied
- [ ] Verified
