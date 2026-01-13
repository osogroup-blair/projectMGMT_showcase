export { setupAuth, isAuthenticated, getSession } from "./replitAuth";
export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";
export { 
  setupMicrosoftAuth, 
  isMicrosoftAuthEnabled, 
  getMicrosoftAuthConfig,
  setMicrosoftAuthEnabled,
  setMicrosoftAllowedDomains 
} from "./microsoftAuth";
