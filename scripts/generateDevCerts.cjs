const { generateCertificates } = require("office-addin-dev-certs/lib/generate");

generateCertificates().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
