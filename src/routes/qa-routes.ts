import * as Router from 'koa-router';
import createTestData = require('qa/createTestData');
import createTestDataAuction = require('qa/createTestDataAuction')

export const qaRouter = new Router();

//Routes for the user entity
qaRouter.post('/qa/users', createTestData.TestData.createTestUsers);          //Create some test users
qaRouter.post('/qa/auctions', createTestDataAuction.TestData.createTestAuctions);          //Create some test users