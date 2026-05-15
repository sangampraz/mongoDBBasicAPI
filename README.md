## mongoDBBasicAPI

# Teams API - Node, Express, & MongoDB
This project uses the same development-container style and team data structure from teh `mongodb-app-01-s26 repo`:
```js
{name: "Arsenal", gamesPlayed: 36, gamesWon: 24, gamesLoss: 5, location: "Greater London" }
```
The database connection is configured through `.env`:
```bash
PORT=3000
MONGODB_URI=mongodb://db:27017
DB_NAME=storeDB
COLLECTION_NAME=teams
```

## Run in VS Code Dev Containers
* 1. Open the folder in VS Code.
* 2. Choose Reopen in Container. 
* 3. After teh container finishes building run:
```bash
npm run seed
npm run dev
```
Open:
```bash
http://localhost:3000
```

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Check API and database connection |
| GET | `/api/teamss` | List all teams |
| GET | `/api/teams?location=Greater London` | Filter by location |
| GET | `/api/products?minPrice=50&maxPrice=200` | Filter by price range |
| GET | `/api/teams/:id` | Get one team0 |
| POST | `/api/teams` | Create a team |
| PUT | `/api/teams/:id` | Replace a team |
| PATCH | `/api/teams/:id` | Partially update a team |
| DELETE | `/api/teams/:id` | Delete a team |


## Example Queries

```bash
curl http://localhost:3000/api/teams
curl "http://localhost:3000/api/location=Greater"
curl "http://localhost:3000/api/teams?gamesWon=20&gamesLoss=10"
curl "http://localhost:3000/api/teamss?gamesPlayed=25"
```

## Answer for the questions in mongodb-app-01-s26
1. What is the purpose of using `.env`
-> The purpose of using a `.env` file is to store configuration variable and sensitive information separately from the main application code. This makes the applicaiton easier to manage, more secure, and more flexible across different environments (development, testing, production).

2. How does this work:
```js
if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
}
```
-> This code checks whether the user provided a minimum or maximum price in the URL query. If they did, it creates a `price` filter object. The `$gte` operator is used to find products greater than or equal to the minimum price, and `$lte` is used to find products less than or equal to the maximum price. This allows the API to return only products within the selected price range. 

3. What is the program `seed.js` used for?
-> The `seed.js` program is used to initialize the database with sample product data. It connects to MongoDB, deletes any existing products, and inserts new products from the `products.js` file. This is useful for testing and resetting the database to a known starting state during development. 

4. Try all API routes using Postman
-> Tried all

5. In terms of code what is the difference between `put` and `patch`
-> `PUT` is used to fully update a product and requires all important fields to be sent in the request. In the code, the `PUT` route creates a complete product object and validates all fields before updating the database.

`PATCH` is used for partial updates and only changes the fields provided by the user. In the code, the `PATCH` route dynamically builds an `updates` object and updates only the specified fields while leaving the rest unchanged.

