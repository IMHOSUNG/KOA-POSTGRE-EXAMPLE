//server.ts
import { postgresDB } from 'databases/postgres-db';
import {qaRouter} from 'routes/qa-routes';
import {restRouter} from 'routes/rest-routes';
import {wsRouter} from 'routes/ws-routes';
import * as bodyParser from 'koa-bodyparser';
import Route = require('koa-router')
var app = require('./app')
import WebSocket = require('ws');
import http = require('http');
const server = http.createServer(app)

const serverTime = () => {
}

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

    //Tell the app to listen on port 3000
    app.listen(3000);
};


const wsConnect = async () => {
    const wss = new WebSocket.Server({server});
    app.use(bodyParser());
    app.use(wsRouter.routes(), wsRouter.allowedMethods())

    wss.on('connection', (ws:WebSocket)=> {
      ws.on('message', (message: string) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);

        const broadcastRegex = /^broadcast\:/;

        if (broadcastRegex.test(message)) {
            message = message.replace(broadcastRegex, '');

            //send back the message to the other clients
            wss.clients
                .forEach(client => {
                    //if (client != ws) {
                        client.send(`Hello, broadcast message -> ${message}`);
                    //}    
                });
            
        } else {
            ws.send(`Hello, you sent -> ${message}`);
        }
      });
      ws.send('Hi there, I am a WebSocket Server')
    });
    
    app.listen(4000,()=>{
        console.log(`${4000} start`)
    });
}

//bootstrap();
wsConnect();