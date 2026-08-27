require('dotenv').config();
const neo4j = require('neo4j-driver');

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD;

let driver;

function getDriver() {
  if (!driver) {
    if (!uri || !password) {
      throw new Error('Database credentials missing in environment variables');
    }
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

async function verifyConnection() {
  const drv = getDriver();
  // Verify connectivity
  await drv.verifyConnectivity();
  return true;
}

module.exports = {
  getDriver,
  verifyConnection
};
