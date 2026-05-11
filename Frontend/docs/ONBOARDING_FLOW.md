# Onboarding Flow Implementation

## Overview

The onboarding flow ensures that all new users complete a 4-step personalization questionnaire before accessing the main dashboard and protected routes.

## User Journey

### 1. New User Registration
- User navigates to `/register`
- Fills in name, email, and password
- Submits form → API call to `POST /auth/register`
- Onboarding cookie is cleared: `onboarding-completed=false`
- User is redirected to `/onboarding`

### 2. Returning User Login
- User navigates to `/login`
- Enters email and password
- Submits form → API call to `POST /auth/login`
- Gets user profile from `GET /auth/profile`
- If `user.onboarding_completed === true`:
  - Sets cookie: `onboarding-completed=true`
  - Redirects to `/dashboard`
- If `user.onboarding_completed === false`:
  - Cookie remains unset
  - Redirects to `/onboarding`

### 3. Onboarding Flow
The 4-step questionnaire:
1. **Welcome Screen** - Introduction message
2. **Category Selection** - Select at least one category from 8 options
3. **Budget Range** - Set typical purchase budget ($10-$5,000)
4. **Shopping Interests** - Select at least one shopping interest from 6 options

When user clicks "Complete Onboarding":
- API call to `POST /auth/onboarding` with preferences
- Sets cookie: `onboarding-completed=true`
- Updates user store with `onboarding_completed: true`
- Redirects to `/dashboard`

### 4. Dashboard Access
- User can now access `/dashboard`, `/products`, `/checkout`, `/analytics`, etc.
- All protected routes are guarded by middleware

## Middleware Protection

### Route Guards (middleware.ts)

**Protected Routes** (require auth + onboarding):
- `/dashboard`
- `/products`
- `/cart`
- `/wishlist`
- `/checkout`
- `/analytics`

**Onboarding Routes** (require auth only):
- `/onboarding`

**Public Routes** (no auth required):
- `/` (landing)
- `/login`
- `/register`

### Middleware Logic

```
IF user on protected route AND no auth token
  → Redirect to /login

IF user on protected route AND has token AND NOT onboarded
  → Redirect to /onboarding

IF user on protected route AND has token AND onboarded
  → Allow access

IF user on onboarding route AND onboarded
  → Redirect to /dashboard

IF user on login/register AND has token
  → Redirect to /dashboard (or /onboarding if not yet onboarded)
```

## Cookie Management

### Auth Token Cookie
- Name: `auth-token`
- Set in: LoginForm (`lib/api/auth.ts`)
- Max-age: 86400 seconds (24 hours)
- Used by: Middleware for protecting routes

### Onboarding Completed Cookie
- Name: `onboarding-completed`
- Values: `'true'` or cleared (`''`)
- Set in: LoginForm, OnboardingForm
- Cleared in: RegisterForm, Logout
- Max-age: 31536000 seconds (1 year)
- Used by: Middleware to check if user completed onboarding

## API Endpoints Used

1. **Register**: `POST /auth/register`
   - Body: `{ name, email, password }`
   - Returns: User object

2. **Login**: `POST /auth/login`
   - Body: `{ email, password }` (form-data format)
   - Returns: `{ access_token }`

3. **Get Profile**: `GET /auth/profile`
   - Headers: `Authorization: Bearer {token}`
   - Returns: User object with `onboarding_completed` flag

4. **Complete Onboarding**: `POST /auth/onboarding`
   - Headers: `Authorization: Bearer {token}`
   - Body: `{ categories, budget_range, interests }`
   - Returns: Updated user object

## Testing the Flow

### Scenario 1: New User
1. Go to `/register`
2. Create account with email/password
3. Should redirect to `/onboarding`
4. Complete 4-step questionnaire
5. Should redirect to `/dashboard`

### Scenario 2: Returning User
1. Go to `/login`
2. Enter credentials of user who completed onboarding
3. Should redirect to `/dashboard`

### Scenario 3: Incomplete Onboarding
1. Go to `/login`
2. Enter credentials of user who has NOT completed onboarding
3. Should redirect to `/onboarding`
4. Complete questionnaire
5. Should redirect to `/dashboard`

### Scenario 4: Protected Route Access
1. Try to access `/dashboard` without logging in
2. Should redirect to `/login`
3. Log in, should redirect based on onboarding status

## Troubleshooting

### User sees dashboard instead of onboarding
- Check that `onboarding-completed` cookie is not set for new users
- Verify backend returns `onboarding_completed: false` for new users
- Check browser console for any errors in middleware

### User stuck in onboarding loop
- Verify API call to `/auth/onboarding` succeeds
- Check that response includes `onboarding_completed: true`
- Ensure `document.cookie` is setting the cookie correctly

### Unable to access protected routes
- Verify `auth-token` cookie is set correctly
- Check that token is valid and not expired
- Look at middleware errors in server logs
