import { RequestHandler } from "express";

/**
 * Middleware to check if user is authenticated
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please login.'
    });
    return;
  }
  next();
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please login.'
    });
    return;
  }

  if (req.session.userRole !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user has admin or receptionist role
 */
export const requireStaff: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please login.'
    });
    return;
  }

  if (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Staff privileges required.'
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user has receptionist role
 */
export const requireReceptionist: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please login.'
    });
    return;
  }

  if (req.session.userRole !== 'receptionist' && req.session.userRole !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Receptionist privileges required.'
    });
    return;
  }

  next();
};
