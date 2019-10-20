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

const EmitMessage = async(value:string) => {

    //command 
    // command error "Run. Run. Or it will explode"

    let con = await MQConnection();
    let ch = await con.createChannel();

    let exchangeMN = 'topic_log';
    let msg_1 = randString();
    let msg_2 = randString();

    let args = process.argv.slice(2);
    console.log(args);
    let serverity_1 = 'BTC.BUY.'+value;
    let serverity_2 = 'BTC.SELL.'+value;

    //topic 방식
    //exchange를 topic으로 바꾸면 된다.
    ch.assertExchange(exchangeMN, 'topic', {
        durable : false
    })

    //exchage publish sell queue
    ch.publish(exchangeMN, serverity_1 , Buffer.from(msg_1));
    console.log("[x] Sent %s: '%s'", serverity_1, msg_1);

    //exchange publish buy queue
    ch.publish(exchangeMN, serverity_2 , Buffer.from(msg_2));
    console.log("[x] Sent %s: '%s'", serverity_2, msg_2);
}


const receiveLogDirect = async() => {
    
    let con = await MQConnection();
    let ch = await con.createChannel();

    let exchangeMN = 'topic_log';
    
    //topic 방식
    //exchange를 topic으로 바꾸면 된다.
    ch.assertExchange(exchangeMN, 'topic',{
        durable : false
    })

    let q = await ch.assertQueue('')
    let getq = await ch.assertQueue('')
    console.log('[*] Waiting for logs. To exit press CTRL+C');
    let severity_1 = 'BTC.BUY.*'
    let severity_2 = 'BTC.SELL.*'
    ch.bindQueue(q.queue, exchangeMN, severity_1);

    ch.consume(q.queue, (msg)=>{
        console.log(" [x] %s %s", msg.fields.routingKey,msg.content.toString());
        ch.bindQueue(getq.queue, exchangeMN, severity_2);
        ch.consume(getq.queue, (msg)=>{
            console.log(" [x] %s %s", msg.fields.routingKey,msg.content.toString());
        },{
            noAck :true
        })
    },{
        noAck : true
    })
}

setInterval(async()=>await EmitMessage('10000') , 0);
setInterval(async()=>await EmitMessage('15000') , 0);