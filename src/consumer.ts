import readline from 'readline';
import mqtt from 'mqtt';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const broker = mqtt.connect('mqtt://test.mosquitto.org/');

console.log('Aguarde a conexão com o broker.');

broker.on('connect', () => {
    broker.subscribe('mqtt_supermarket', () => {
        console.log('mqtt_supermarket subscribed!');
    });
});

broker.on('message', (topic, message) => {
    const response = message.toString();

    console.log(response);
});

rl.on('line', (line) => {
    broker.publish('mqtt_supermarket/client', line + '\n');

    if (line === 'exit') {
        broker.publish(
            'mqtt_supermarket/client',
            'Cancelando subscrição para mqtt_supermarket/client \n',
        );
        broker.unsubscribe('mqtt_supermarket');
        rl.close();
        process.exit(0);
    }
});
