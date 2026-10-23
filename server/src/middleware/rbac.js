/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces strict backend authorization rules.
 */

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to permission evaluation.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}].`
      });
    }

    next();
  };
};

/**
 * Service Area Boundary Enforcement
 * Restricts supervisors to their assigned district/service area, while allowing admins system-wide access.
 */
export const enforceServiceArea = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // Admins and Auditors have unrestricted system-wide view
  if (req.user.role === 'admin' || req.user.role === 'auditor') {
    return next();
  }

  // Supervisors are scoped to their assigned service area
  if (req.user.role === 'supervisor') {
    req.serviceAreaFilter = req.user.serviceArea;
  }

  next();
};

/**
 * Maintenance Worker Scope Enforcement
 * Ensures workers can only view and mutate assignments and repair tasks allocated directly to them.
 */
export const enforceWorkerScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (req.user.role === 'worker') {
    req.workerScopeId = req.user._id;
  }

  next();
};
