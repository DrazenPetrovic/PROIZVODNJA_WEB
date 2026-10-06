import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ error: 'Nedostaje autorizacija' });
    }

    const verified = jwt.verify(token, env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Nevažeći token' });
  }
};

// Ide nakon verifyToken — propušta samo vlasnika (vrsta_radnika = 1)
export const requireVlasnik = (req, res, next) => {
  if (Number(req.user?.vrstaRadnika) !== 1) {
    return res.status(403).json({ success: false, message: 'Nemate pravo pristupa.' });
  }
  next();
};
