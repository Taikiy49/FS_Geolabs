export const msalConfig = {
  auth: {
    clientId: 'e00c4440-0129-4b66-94dc-02ea645fd13c',
    authority: 'https://login.microsoftonline.com/0b6bfb2a-ae2a-4961-9c6a-bd500f86bfbc',
    redirectUri: window.location.origin,  // Automatically sets to localhost or production URL
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};
