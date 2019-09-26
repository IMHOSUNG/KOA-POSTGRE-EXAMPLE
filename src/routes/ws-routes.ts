import * as Router from 'koa-router';
import controller = require('controllers');

export const wsRouter = new Router();

//Routes for the user entity
wsRouter.get('/ws', controller.wsaction.accessTest);          //Create some test users
wsRouter.get('/ws/test', controller.wsaction.accessTest);