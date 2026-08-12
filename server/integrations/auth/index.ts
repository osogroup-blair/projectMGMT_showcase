export { setupSessionAuth, isAuthenticated, getSession } from "./sessionAuth";
export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";
export { 
  setupMicrosoftAuth, 
  isMicrosoftAuthEnabled, 
  getMicrosoftAuthConfig,
  setMicrosoftAuthEnabled,
  setMicrosoftAllowedDomains 
} from "./microsoftAuth";
export {
  setupGoogleAuth,
  isGoogleAuthEnabled,
  getGoogleAuthConfig,
  setGoogleAuthEnabled
} from "./googleAuth";
