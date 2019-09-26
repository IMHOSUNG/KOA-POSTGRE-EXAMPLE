//server.ts
import { postgresDB } from 'databases/postgres-db';
import {qaRouter} from 'routes/qa-routes';
import {restRouter} from 'routes/rest-routes';
import {wsRouter} from 'routes/ws-routes';
import * as bodyParser from 'koa-bodyparser';
import Route = require('koa-router')
var router = new Route<any>();
var app = require('./app')
import WebSocket = require('ws');
import * as Koa from 'koa';
/*
const bootstrap = async () => {

    // Initialize the database
    await postgresDB();

     // Enable bodyParser which is needed to work with information
    // passed to the server from the client requests 
    app.use(bodyParser());

    //Tell our application to use the router we have created to handle routes related to testing
    app.use(qaRouter.routes(), qaRouter.allowedMethods())

    //Tell our application to use the router we have created to handle routes for our rest api
    app.use(restRouter.routes(), restRouter.allowedMethods())

    app.ws.use(wsRouter.routes(), wsRouter.allowedMethods())
    console.log(app.ws.clients)
    //Tell the app to listen on port 3000
    app.listen(3000);
};*/
import http = require('http');
const server = http.createServer(app)

const wsConnect = async () => {
    const wss = new WebSocket.Server({ server });
 
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    ws.send('something');
  });
 
  ws.send('something');
    });
    server.listen(3000,()=>{
        console.log("3000 start")
    });
}

//bootstrap();
wsConnect();