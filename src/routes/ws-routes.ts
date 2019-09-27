import * as Router from 'koa-router';
import controller = require('controllers');

export const wsRouter = new Router();

//Routes for the user entity
wsRouter.all('/ws', controller.wsaction.accessTest);