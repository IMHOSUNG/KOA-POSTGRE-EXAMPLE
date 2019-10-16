// 월요일 날 할 부분
// rabbitmq 설정 시작 
// amqp/lib 사용
import * as amqp from 'amqplib'
import * as MQConfig from './amqp-config'

const randString = () => {
    let str = Math.random()
            .toString(36)
            .replace(/[^a-z]+/g,'')
            .substr(0,5);

    return str;
}

export const MQConnection = async() => {
    
    let config = await MQConfig.ConnectInfo();
    let host = config['host'];
    let port = config['port'];
    let user = config['username'];
    let pw = config['password'];
    console.log(`${host} ${port} ${user} ${pw}`)

    let open = await amqp.connect(`amqp://${user}:${pw}@${host}`)
    return open
} 

export const channel = async() => {
    
    let ch = await MQConnection().then((ch)=>{
        return ch.createChannel();
    }).then((ch)=>{
        return ch;
    })
    return ch
}

export const exchanges = async() => {

    await channel().then((ch)=>{
        ch.assertExchange("","direct");
    })
}

const send = async() => {
    let con = await MQConnection();
    let ch = await con.createChannel();

    let queue = 'hello';
    let msg = "hello world"
    //message queue를 생성할 때 durable : true로 설정할 경우 RabbitMq가 죽어도 
    // task를 잃어 버리지 않는다.
    await ch.assertQueue(queue,{ durable : true})
    ch.sendToQueue(queue, Buffer.from(msg),{persistent : true});
    console.log("[x] 보낸 %s", msg);

    setTimeout(() => {
        con.close();
        process.exit(0);
    }, 500);
}

const receive = async() => {
    let con = await MQConnection();
    let ch = await con.createChannel();
    
    let queue = 'hello'

    //이미 만들어진 큐는 적용이 안된다. >> 다른 큐를 만들어서 적용한다. 
    // durable을 true로 하면 큐를 다시 재시작해도 메시지를 잃어버리지 않는다.
    ch.assertQueue(queue,{ durable : true})

    // 1개씩 만 받아오는 명령어
    ch.prefetch(1);
    console.log("[*] Waiting for message in %s. To exit process CTRL+C",queue);

    ch.consume(queue, (msg:amqp.ConsumeMessage)=>{
        console.log("[x] Received %s",msg.content.toString());
        setTimeout(()=>{
            console.log("log [x] Done");
            ch.ack(msg);
        }, 10);
    },
    // worker을 ctrl+c로 죽여도, 메시지가 없어지지 않는다. 
    // 워커가 일을 하고 워커로 부터 적절한 ack 시그널을 받는다. 
    {
        noAck : false
    })
}

const newTask = async() => {

    let con = await MQConnection();
    let ch = await con.createChannel();

    let q = 'task_queue';
    let msg = process.argv.slice(2).join('') || 'Hello World';

    // 해당 큐 있는 지 확인, 없으면 다시 만든다; 
    ch.assertQueue(q, {durable : true});
    ch.sendToQueue(q, Buffer.from(msg),{ persistent : true});
    
    setTimeout(()=>{
        con.close();
        process.exit(0);
    },500);
}


const exchangeEmitLog = async() => {
    let con = await MQConnection();
    let ch = await con.createChannel();
    
    let exchangeMachine = 'log';
    let msg = process.argv.slice(2).join('') || randString();

    ch.assertExchange( exchangeMachine , 'fanout', {
        durable : false
    })

    ch.publish(exchangeMachine, '' , Buffer.from(msg));

    console.log("[x] 보낸 %s", msg);
}

const receive_Log_From_Exchange_Machine = async() => {

    let con = await MQConnection();
    let ch = await con.createChannel();

    let exchangeMachine = 'log';
    
    ch.assertExchange(exchangeMachine, 'fanout', {
        durable : false
    })

    let q = await ch.assertQueue(``, {
        exclusive : true
    })
    
    console.log("[*] %s 의 메시지 대기 중, 종료하려면 Ctrl + C를 누르십시오", q.queue);
    // exchange Maching 과 queue를 연결 
    ch.bindQueue(q.queue, exchangeMachine, '');
    ch.consume(q.queue, (msg:amqp.ConsumeMessage)=>{
        if(msg.content){
            console.log(
                "[x] %s", msg.content.toString()
            )
        }
    })
    ,{
        noAck : true       
    }
    
}

const DirectEmitLog = async() => {

    //command 
    // command error "Run. Run. Or it will explode"

    let con = await MQConnection();
    let ch = await con.createChannel();

    let exchangeMN = 'direct_logs';
    let msg = randString();
    
    let args = process.argv.slice(2);
    console.log(args);
    let serverity = (args.length > 0) ? args[0]: 'info';

    //topic 방식
    //exchange를 topic으로 바꾸면 된다.
    ch.assertExchange(exchangeMN, 'direct', {
        durable : false
    })

    ch.publish(exchangeMN, serverity , Buffer.from(msg));
    console.log("[x] Sent %s: '%s'", serverity, msg);
}


const receiveLogDirect = async() => {
    let con = await MQConnection();
    let ch = await con.createChannel();

    let args = process.argv.slice(2);
    console.log(args);

    if (args.length == 0) {
    console.log("Usage: receive_logs_direct.js [info] [warning] [error]");
    process.exit(1);
    }

    let exchangeMN = 'direct_logs';
    
    //topic 방식
    //exchange를 topic으로 바꾸면 된다.
    ch.assertExchange(exchangeMN, 'direct',{
        durable : false
    })

    let q = await ch.assertQueue('')
    console.log('[*] Waiting for logs. To exit press CTRL+C');
    args.forEach((severity)=>{
        ch.bindQueue(q.queue, exchangeMN, severity);
    })
    ch.consume(q.queue, (msg)=>{
        console.log(" [x] %s %s", msg.fields.routingKey,msg.content.toString());

    },{
        noAck : true
    })
}

// routerkey와 topic 차이
// Routerkey = 'direct'의 Routing Key
// topic = 'topic'
// 점(.) 으로 구분된 단어 목록 topic은 임의의 routing_key를 가질 수 없다.
// * > 정확히 한 단어를 대체 할 수 있다.
// # > 0개 이상의 단어를 대체할 수 있다.

//send();
//send();
//receive();
//receive_Log_From_Exchange_Machine();
receiveLogDirect();