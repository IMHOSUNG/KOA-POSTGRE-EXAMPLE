//server.ts
import { postgresDB } from 'databases/postgres-db';
import {qaRouter} from 'routes/qa-routes';
import {restRouter} from 'routes/rest-routes';
import {wsRouter} from 'routes/ws-routes';
import * as bodyParser from 'koa-bodyparser';
import * as Koa from 'koa';
var app = require('./app')
import WebSocket = require('ws');
import webSockify = require('koa-websocket')
import http = require('http');
import Router = require('koa-router');
import { NextFunction } from 'connect';
import * as RedisSMQ from 'rsmq'

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
const wsGetPostAndSendingBack = async(koa:any,kPort:number, Port:number,backUrl?:string) => {

  await postgresDB();
  koa.use(bodyParser())
  koa.use(qaRouter.routes(), qaRouter.allowedMethods())
  koa.use(restRouter.routes(), restRouter.allowedMethods())
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
          client.send(`Hello -> ${message}`);
        })
      })
  })

  koa.context.wss = wsServer;
  koa.use(wsRouter.routes(), wsRouter.allowedMethods());
  koa.listen(kPort);
}


const wsGetWsAndSendingFront = async(koa:any,kPort:number, Port:number) => {

  const wsServer = new WebSocket.Server({ port:Port })
  wsServer.on('connection', (ws:WebSocket)=>{
      console.log('ws sending front connect');
      ws.on('message', (message:string)=>{
        wsServer.clients.forEach(client=>{
          console.log(message)
          client.send(`${message}`);
        })
      })
  })
}

const TestRSMQ = async() => {

  // ns 는 namespace 같은 것
  const rsmq = new RedisSMQ({host : "localhost", port: 6379 , ns : "rsmq"}) 
  
  //rsmq.deleteQueueAsync({qname:"myqueue"})

  await rsmq.createQueueAsync({qname:"myqueue"})
  .then((resp)=>{
    if(resp == 1)
      console.log("queue created");
  }).catch(async(err)=>{
      if(err.name == "queueExists"){
        await rsmq.deleteQueueAsync({qname:"myqueue"}).then(async()=>{
          console.log("existed queue delete");
          await rsmq.createQueueAsync({qname:"myqueue"}).then(()=>{
            console.log("make new queue");
          })
        })
      }
  })

  await rsmq.sendMessageAsync({qname:"myqueue", message:"Hello World"}).then(function (resp) {
    if (resp) {
        console.log("Message sent. ID:", resp);
    }
  });

  await rsmq.receiveMessageAsync({qname:"myqueue"}).then(async(resp) => {
    if (resp['id']) {
        console.log("Message received.", resp)	
        await rsmq.deleteMessageAsync({qname:"myqueue", id:resp['id']}).then(()=>{
          console.log(`delete ${resp['id']}`);
        })
    }
    else {
        console.log("No messages for me...")
    }
  });
  await rsmq.receiveMessageAsync({qname:"myqueue"}).then(async(resp) => {
    if (resp['id']) {
        console.log("Message received.", resp)	
        await rsmq.deleteMessageAsync({qname:"myqueue", id:resp['id']}).then(()=>{
          console.log(`delete ${resp['id']}`);
        })
    }
    else {
        console.log("No messages for me...")
    }
  });

  
}

//bootstrap();
//wsBasic();
//wsKoaWebSocket();
//wsGetWsAndSendingFront(koa,5000,5001);
//wsGetPostAndSendingBack(koa,4000,4001,'ws://localhost:5001/');
//wsGetPostAndSendingBack(koa,4100,4101,'ws://localhost:5001/');
TestRSMQ();
