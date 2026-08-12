import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { firestoreDb } from "../../db";

class FirestoreStore extends session.Store {
  get = (sid: string, callback: (err: any, session?: session.SessionData | null) => void) => {
    firestoreDb.collection("sessions").doc(sid).get()
      .then(doc => {
        if (!doc.exists) return callback(null, null);
        const data = doc.data();
        if (data && data.expire && new Date(data.expire) < new Date()) {
          this.destroy(sid, () => {});
          return callback(null, null);
        }
        callback(null, data ? JSON.parse(data.sess) : null);
      })
      .catch(err => callback(err));
  };

  set = (sid: string, sess: session.SessionData, callback: (err?: any) => void) => {
    const expire = sess.cookie.expires ? new Date(sess.cookie.expires) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    firestoreDb.collection("sessions").doc(sid).set({
      sess: JSON.stringify(sess),
      expire: expire.toISOString()
    })
      .then(() => callback(null))
      .catch(err => callback(err));
  };

  destroy = (sid: string, callback: (err?: any) => void) => {
    firestoreDb.collection("sessions").doc(sid).delete()
      .then(() => callback(null))
      .catch(err => callback(err));
  };
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const sessionStore = new FirestoreStore();
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && process.env.INSECURE_AUTH !== "true",
      maxAge: sessionTtl,
    },
  });
}

export async function setupSessionAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Generic logout route
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Session expiration is handled by express-session and the PostgreSQL session store
  // The session TTL (1 week) is the authoritative expiration, not the OAuth token's expires_at
  // OAuth token expiration (typically 1 hour) should not invalidate the user's session

  return next();
};
