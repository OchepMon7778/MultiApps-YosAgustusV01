const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

// Verify JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user profile from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', decoded.id)
      .single();

    if (error || !profile || !profile.is_active) {
      return res.status(401).json({ 
        error: 'Invalid token or user inactive',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = {
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      is_active: profile.is_active
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  }
};

// Role-based Authorization
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        user_role: req.user.role
      });
    }

    next();
  };
};

// Optional Authentication
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', decoded.id)
        .single();
        
      if (profile && profile.is_active) {
        req.user = {
          id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          is_active: profile.is_active
        };
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
};