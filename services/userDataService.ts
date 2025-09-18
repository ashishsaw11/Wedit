import type { UserInfo } from '../types';

const DEVELOPER_EMAIL = 'saw092821@gmail.com';

/**
 * Opens the user's default email client with pre-filled user data
 * to be sent to the developer for service usage records.
 */
export const sendUserInfoToDeveloper = (userInfo: UserInfo): void => {
  try {
    const subject = "New User Data from Magic Editor";
    const body = `Hello,\n\nThe following user has registered to use the video service:\n\n${JSON.stringify(userInfo, null, 2)}`;
    
    const mailtoLink = `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // This will attempt to open the user's default mail client.
    window.location.href = mailtoLink;

  } catch (error) {
    console.error("Failed to create mailto link:", error);
    // Provide a fallback for environments where this might fail (e.g., sandboxed iframes)
    alert("Could not open email client automatically. Please send your details manually to the developer.");
  }
};
