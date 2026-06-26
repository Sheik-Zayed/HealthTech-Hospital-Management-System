const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access forbidden: This resource requires one of [${roles.join(', ')}] role`
      });
    }
    next();
  };
};

module.exports = { authorize };
