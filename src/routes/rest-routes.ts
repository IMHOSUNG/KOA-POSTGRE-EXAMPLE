//routes/rest-routes.ts
import * as Router from 'koa-router';
import controller = require('controllers');

export const restRouter = new Router();

//Routes for the user entity
restRouter.get('/users', controller.user.getUsers);             //Get all users in the database
restRouter.get('/users/:id', controller.user.getUser);          //Get a single user by id
restRouter.post('/users', controller.user.createUser);          //Create a single user in the database
restRouter.put('/users/:id', controller.user.updateUser);       //Update a single user that matches the passed id
restRouter.delete('/users/:id', controller.user.deleteUser);    //Delete a single user that matches the passed id


restRouter.get('/auctions',controller.auction.getAuctions);
restRouter.get('/auctions/:id',controller.auction.getAuction);
restRouter.post('/auctions',controller.auction.createAuction);
restRouter.put('/auctions/:id',controller.auction.updateAuction);
restRouter.delete('/auctions/:id',controller.auction.deleteAuction);