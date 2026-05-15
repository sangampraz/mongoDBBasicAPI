const express = require('express');
const path = require('path');
require('dotenv').config();

const { ConnectToDatabase, ToObjectId, CloseDatabase } = require('./db');
const { queryObjects } = require('v8');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function BuildTeamQuery(query) {
    const filter = {};

    if (query.location) {
        filter.location = { $regex: query.location, $options: 'i' };
    }

    if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' };
    }

    if (query.minGamesPlayed || query.maxGamesPlayed) {
        filter.gamesPlayed = {};
        if (query.minGamesPlayed) filter.gamesPlayed.$gte = Number(query.minGamesPlayed);
        if (query.maxGamesPlalyed) filter.gamesPlayed.$lte = Number(query.maxGamesPlayed);
    }

    if (query.minGamesWon || query.maxGamesWon) {
        filter.gamesWon = {};
        if (query.minGamesWon) filter.gamesWon.$gte = Number(query.minGamesWon);
        if (query.maxGamesWon) filter.gamesWon.$lte = Number(query.maxGamesWon);
    }

    if (query.minGamesLoss || query.maxGamesLoss) {
        filter.gamesLoss = {};
        if (query.minGamesLoss) filter.gamesLoss.$gte = Number(query.minGamesLoss);
        if (query.maxGamesLoss) filter.gamesLoss.$lte = Number(query.maxGamesLoss);
    }

    return filter;
}

function ValidateTeam(team) {
    if (!team.name || typeof team.name !== 'string') {
        return 'Team name is required.';
    }
    if (!Number.isInteger(team.gamesPlayed) || team.gamesPlayed < 0) {
        return 'Team games played must be a non-negative integer.';
    }
    if (!Number.isInteger(team.gamesWon) || team.gamesWon < 0) {
        return 'Team game won must be a non-negative integer.';
    }
    if (!Number.isInteger(team.gamesLoss) || team.gamesLoss < 0) {
        return 'Team game loss must be a non-negative integer.';
    }
    if (!team.location || typeof team.location !== 'string') {
        return 'Team location is required.';
    }
    return null;
}

app.get('/api/health', async (request, response) => {
  const collection = await ConnectToDatabase();
  const count = await collection.countDocuments();
  response.json({ status: 'ok', database: process.env.DB_NAME, DataTransferItemList: count });
});

app.get('/api/teams', async (request, response) => {
  const collection = await ConnectToDatabase();
  const filter = BuildTeamQuery(request.query);
  const teams = await collection.find(filter).sort({ name: 1 }).toArray();
  response.json(teams);
});

app.get('/api/teams/:id', async (request, response) => {
  const id = ToObjectId(request.params.id);
  if (!id) {
    return response.status(400).json({ error: 'Invalid team id.' });
  }

  const collection = await ConnectToDatabase();
  const team = await collection.findOne({ _id: id });

  if (!team) {
    return response.status(404).json({ error: 'Team not found.' });
  }

  response.json(team);
});

app.post('/api/teams', async (request, response) => {
  const team = {
    name: request.body.name,
    gamesPlayed: Number(request.body.gamesPlayed),
    gamesWon: Number(request.body.gamesWon),
    gamesLoss: Number(request.body.gamesLoss),
    location: String(request.body.location|| '')
  };

  const error = ValidateTeam(team);
  if (error) {
    return response.status(400).json({ error });
  }

  try {
    const collection = await ConnectToDatabase();
    const result = await collection.insertOne(team);
    response.status(201).json({ ...team, _id: result.insertedId });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ error: 'A team with this name already exists.' });
    }
    throw error;
  }
});

app.put('/api/teams/:id', async (request, response) => {
  const id = ToObjectId(request.params.id);
  if (!id) {
    return response.status(400).json({ error: 'Invalid team id.' });
  }

  const team = {
    name: request.body.name,
    gamesPlayed: Number(request.body.gamesPlayed),
    gamesWon: Number(request.body.gamesWon),
    gamesLoss: Number(request.body.gamesLoss),
    location: String(request.body.location|| '')
  };

  const error = ValidateTeam(team);
  if (error) {
    return response.status(400).json({ error });
  }

  const collection = await ConnectToDatabase();
  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: team, },
    { returnDocument: 'after' }
  );

  if (!result) {
    return response.status(404).json({ error: 'Team not found.' });
  }

  response.json(result);
});

app.patch('/api/teams/:id', async (request, response) => {
  const id = ToObjectId(request.params.id);
  if (!id) {
    return response.status(400).json({ error: 'Invalid team id.' });
  }

  const updates = {};
  if (request.body.name !== undefined) updates.name = request.body.name;
  if (request.body.gamesPlayed !== undefined) updates.gamesPlayed = Number(request.body.gamesPlayed);
  if (request.body.gamesWon !== undefined) updates.gamesWon= Number(request.body.gamesWon);
  if (request.body.gamesLoss !== undefined) updates.gamesLoss= Number(request.body.gamesLoss);
  if (request.body.location !== undefined) updates.location = String(request.body.location);
  if (request.body.status !== undefined) updates.status = request.body.status;
  if (request.body.reorderNeeded !== undefined) updates.reorderNeeded = Boolean(request.body.reorderNeeded);

  const collection = await ConnectToDatabase();
  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: updates },
    { returnDocument: 'after' }
  );

  if (!result) {
    return response.status(404).json({ error: 'Team not found.' });
  }

  response.json(result);
});

app.delete('/api/teams/:id', async (request, response) => {
  const id = ToObjectId(request.params.id);
  if (!id) {
    return response.status(400).json({ error: 'Invalid team id.' });
  }

  const collection = await ConnectToDatabase();
  const result = await collection.deleteOne({ _id: id });

  if (result.deletedCount === 0) {
    return response.status(404).json({ error: 'Team not found.' });
  }

  response.status(204).send();
});

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({ error: 'Server error.' });
});

const server = app.listen(port, () => {
  console.log(`Teams API running on http://localhost:${port}`);
});

process.on('SIGTERM', async () => {
  await CloseDatabase();
  server.close();
});
