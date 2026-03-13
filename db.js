const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({
  url: "file:./database/spoiler_alert.db",
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;