function validateSubdomain(req, res, next) {
  const host = req.headers.host; // e.g., "project1.saeuietpu.in:80" or "test.saeuietpu.in"
  
  if (!host) {
    return res.status(400).send("Missing host header");
  }

  // Remove port if present
  const cleanHost = host.split(':')[0];

  if (cleanHost.endsWith(".saeuietpu.in")) {
    return next();
  }

  return res.status(403).send("Forbidden: Invalid subdomain");
}

module.exports = validateSubdomain;
