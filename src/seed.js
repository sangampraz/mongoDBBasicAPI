const { ConnectToDatabase, CloseDatabase } = require('./db');
const teams = require('./teams');

async function Seed() {
  const collection = await ConnectToDatabase();
  await collection.deleteMany({});
  const result = await collection.insertMany(teams);
  console.log(`Inserted ${result.insertedCount} teams.`);
}

Seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(CloseDatabase);
