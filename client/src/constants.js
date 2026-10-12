export const CATEGORIES = ["Plan", "Analyze", "Build", "Debug", "Review", "Backend", "Database", "Testing", "Security", "Maintain", "Delivery", "Learn", "Other"];

export const emptyForm = {
  title: "",
  category: "Plan",
  description: "",
  content: "",
  is_favorite: false
};

export const oauthErrorMessages = {
  google_not_configured: "Google sign-in is not configured. Add Google OAuth credentials to the server environment.",
  google_cancelled: "Google sign-in was cancelled.",
  google_unverified_email: "Google must verify your email address before you can sign in.",
  google_account_conflict: "This Google account could not be linked. Try signing in with your existing account.",
  google_failed: "Google sign-in could not be completed. Please try again."
};