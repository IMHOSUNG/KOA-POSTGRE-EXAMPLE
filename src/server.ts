//server.ts
import { postgresDB } from 'databases/postgres-db';
import {qaRouter} from 'routes/qa-routes';
import {restRouter} from 'routes/rest-routes';
import {wsRouter} from 'routes/ws-routes';
import * as bodyParser from 'koa-bodyparser';
import Route = require('koa-router')
import * as Koa from 'koa';
var app = require('./app')
import WebSocket = require('ws');
import webSockify = require('koa-websocket')
import http = require('http');
import * as Router from 'koa-router';
import { NextFunction } from 'connect';
import { createContext, runInNewContext } from 'vm';


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

    //app.ws.use(wsRouter.routes(), wsRouter.allowedMethods())
    //console.log(app.ws.clients)
    //Tell the app to listen on port 3000
    app.listen(3000);
};


const wsBasic = async () => {

  const server = http.createServer(app)
  
  await postgresDB();
    const wss = new WebSocket.Server({server});

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
    server.listen(4000,()=>{
        console.log(`${4000} start`)
    });
}

const app2 = webSockify(require('./app'))
const routes = new Router();
// how to use koa middleware???
const wsKoaWebSocket = async () => {
  await postgresDB();
  app2.use(bodyParser());

  app2.ws.use(function(ctx:Koa.BaseContext, next:NextFunction) {
    // return `next` to pass the context (ctx) on to the next ws middleware
    return next(ctx);
  });
  //type error how to solve????
  // 개인적인 생각.. define overiding function using typescript  
  // >>????
  // websocket은 ctx.req에 넘길 수 없다. req는 http 프로토콜 전용
  // app.set 방식으로 해결하자
  //app2.ws.use(routes.all('/', ()=>{
  //    console.log('test');
  //  })
 // )
  app2.listen(4000);
}

const koa = require('./app')
const wsGetPostAndSendingBack = async(koa:any,kPort:number, Port:number,backUrl:string) => {

  await postgresDB();
  const wsServer = new WebSocket.Server({ port:Port })
  wsServer.on('connection', (ws:WebSocket)=>{
      console.log('connect');
      ws.on('message', (message:string)=>{
        wsServer.clients.forEach(client=>{
          client.send(`Hello, broadcast message -> ${message}`);
        })
      })
      ws.on('hello', (message:string)=>{
        wsServer.clients.forEach(client=>{
          client.send(`Hello, broadcast message -> ${message}`);
        })
      })
  })

  const wsClient = new WebSocket(backUrl);
  koa.context.wss = wsServer;
  koa.context.wsc = wsClient;
  wsClient.onopen = function(event){
    console.log('sending data');
    wsClient.send('test');
  }
  koa.use((ctx, next) => {
     console.log('set websocket koa get Front port 4000 ws port 4100')
     console.log(`${ctx.wsc}`)
     next();
  });
  koa.use(wsRouter.routes(), wsRouter.allowedMethods());
  koa.listen(kPort);
}


const wsGetWsAndSendingFront = async(koa:any,kPort:number, Port:number) => {

  const wsServer = new WebSocket.Server({ port:Port })
  wsServer.on('connection', (ws:WebSocket)=>{
      console.log('ws sending front connect');
      ws.on('message', (message:string)=>{
        wsServer.clients.forEach(client=>{
          client.send(`Hello, broadcast message -> ${message}`);
        })
      })
  })
}

//bootstrap();
//wsBasic();
//wsKoaWebSocket();
wsGetWsAndSendingFront(koa,5000,5001);
wsGetPostAndSendingBack(koa,4000,4001,'ws://localhost:5001/');

