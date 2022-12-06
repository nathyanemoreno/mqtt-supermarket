import mqtt from 'mqtt';

import { profileController } from './controllers/profile.controller';
import { orderController } from './controllers/order.controller';
import { itemController } from './controllers/item.controller';

import { createTable } from './utils/createTable';

import menu from './data/menu.json';

const broker = mqtt.connect('mqtt://test.mosquitto.org/');


broker.on('connect', async () => {
    console.log('Conectado no broker MQTT');
});

broker.subscribe('mqtt_supermarket/client');

broker.on('message', function (topic, data) {
    const request = data.toString().trim();
    const args = request.split(' ');

    const command = args[0].toLowerCase();

    let eventResponse;

    switch (command) {
        case 'profile':
            eventResponse = profileController(args.slice(1));
            if (eventResponse.error) {
                broker.publish(
                    'mqtt_supermarket',
                    eventResponse.response,
                );
                break;
            }
            broker.publish('mqtt_supermarket', eventResponse.response);
            break;
        case 'show': {
            let showItem = args[1];

            if (!showItem) {
                broker.publish(
                    'mqtt_supermarket',
                    "Comando SHOW: forneça um argumento 'item'.",
                );
                break;
            }
            showItem = showItem.toLowerCase();
            switch (showItem) {
                case 'pedido':
                    if (args[2]) {
                        eventResponse = orderController.show(args[2]);
                        if (eventResponse.error) {
                            broker.publish(
                                'mqtt_supermarket',
                                eventResponse.response,
                            );
                        } else {
                            if (eventResponse.data)
                                broker.publish(
                                    'mqtt_supermarket',
                                    createTable(
                                        ['#', 'Item', 'Quan.', 'Total (R$)'],
                                        eventResponse.data.items.map(
                                            (v: any, i: any) => [
                                                (i + 1).toString(),
                                                menu.items[v.itemId].name,
                                                v.amount.toString(),
                                                (
                                                    menu.items[v.itemId]
                                                        .price_br * v.amount
                                                ).toLocaleString('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRA',
                                                }),
                                            ],
                                        ),
                                    ) +
                                        `Total (R$): ${eventResponse.data.items
                                            .reduce(
                                                (prev: any, curr: any) =>
                                                    prev +
                                                    curr.amount *
                                                        menu.items[curr.itemId]
                                                            .price_br,
                                                0,
                                            )
                                            .toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRA',
                                            })}`,
                                );
                        }
                        break;
                    }

                    eventResponse = orderController.show();
                    if (eventResponse.error) {
                        broker.publish(
                            'mqtt_supermarket',
                            eventResponse.response,
                        );
                        break;
                    }
                    if (eventResponse.data)
                        broker.publish(
                            'mqtt_supermarket',
                            createTable(
                                ['#', 'Item', 'Quan.', 'Total (R$)'],
                                eventResponse.data.items.map(
                                    (v: any, i: any) => [
                                        (i + 1).toString(),
                                        menu.items[v.itemId].name,
                                        v.amount.toString(),
                                        (
                                            menu.items[v.itemId].price_br *
                                            v.amount
                                        ).toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRA',
                                        }),
                                    ],
                                ),
                            ) +
                                `Total (R$): ${eventResponse.data.items
                                    .reduce(
                                        (prev: any, curr: any) =>
                                            prev +
                                            curr.amount *
                                                menu.items[curr.itemId]
                                                    .price_br,
                                        0,
                                    )
                                    .toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRA',
                                    })}`,
                        );
                    break;
                case 'pedidos':
                    eventResponse = orderController.index();

                    broker.publish(
                        'mqtt_supermarket',
                        createTable(
                            ['#', 'Total (R$)'],
                            eventResponse.data.map((v, i) => [
                                (i + 1).toString(),
                                v.items
                                    .reduce(
                                        (prev: any, curr: any) =>
                                            prev +
                                            curr.amount *
                                                menu.items[curr.itemId]
                                                    .price_br,
                                        0,
                                    )
                                    .toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRA',
                                    }),
                            ]),
                        ),
                    );
                    break;
                case 'cardapio':
                    broker.publish(
                        'mqtt_supermarket',
                        createTable(
                            ['#', 'Item', 'Preço (R$)'],
                            menu.items.map((v, i) => [
                                (i + 1).toString(),
                                v.name,
                                v.price_br.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRA',
                                }),
                            ]),
                        ),
                    );
                    break;
                default:
                    broker.publish(
                        'mqtt_supermarket',
                        `Comando SHOW: argumento ${showItem} não faz parte do protocolo SDP.`,
                    );
            }
            break;
        }
        case 'add': {
            let addItem = args[1];
            if (!addItem) {
                broker.publish(
                    'mqtt_supermarket',
                    "Comando ADD: forneça um argumento 'item'.",
                );
                break;
            }
            addItem = addItem.toLowerCase();
            switch (addItem) {
                case 'item':
                    eventResponse = orderController.update(menu, args.slice(1));
                    broker.publish(
                        'mqtt_supermarket',
                        eventResponse.response,
                    );

                    break;
                default:
                    broker.publish(
                        'mqtt_supermarket',
                        `Comando ADD: argumento ${addItem} não faz parte do protocolo SDP.`,
                    );
            }
            break;
        }
        case 'delete': {
            //if (!isAdmin(socket)) {
            //    broker.publish(
            //        'mqtt_supermarket',
            //        `Comando DELETE: Não autorizado. Utilize o comando PROFILE para entrar como um administrador`,
            //    );
            //    break;
            //}
            let deleteItem = args[1];
            if (!deleteItem) {
                broker.publish(
                    'mqtt_supermarket',
                    "Comando DELETE: forneça um argumento 'item'.",
                );
                break;
            }
            deleteItem = deleteItem.toLowerCase();
            switch (deleteItem) {
                case 'item':
                    // Deletar pedidos com aquele item
                    orderController.delete(args.slice(1));

                    // Deletar item do menu
                    eventResponse = itemController.delete(menu, args.slice(1));
                    if (eventResponse.error) {
                        broker.publish(
                            'mqtt_supermarket',
                            eventResponse.response,
                        );
                        break;
                    }
                    broker.publish(
                        'mqtt_supermarket',
                        'OBS: Todos os pedidos contendo este item foram deletados.',
                    );
                    broker.publish(
                        'mqtt_supermarket',
                        eventResponse.response,
                    );
                    break;
                default:
                    broker.publish(
                        'mqtt_supermarket',
                        `Comando ADD: argumento ${deleteItem} não faz parte do protocolo SDP.`,
                    );
            }
            break;
        }
        case 'create': {
            let createItem = args[1];
            if (!createItem) {
                broker.publish(
                    'mqtt_supermarket',
                    "Comando CREATE: forneça um argumento 'item'.",
                );
                break;
            }
            createItem = createItem.toLowerCase();
            switch (createItem) {
                case 'pedido':
                    eventResponse = orderController.prepare();
                    broker.publish(
                        'mqtt_supermarket',
                        eventResponse.response,
                    );
                    break;
                case 'item':
                    //if (!isAdmin(socket)) {
                    //    broker.publish(
                    //        'mqtt_supermarket',
                    //        `Comando CREATE: Não autorizado. Utilize o comando PROFILE para entrar como um administrador`,
                    //    );
                    //    break;
                    //}
                    eventResponse = itemController.store(args);
                    if (eventResponse.error) {
                        broker.publish(
                            'mqtt_supermarket',
                            eventResponse.response,
                        );
                        break;
                    }
                    eventResponse.data && menu.items.push(eventResponse.data);
                    broker.publish(
                        'mqtt_supermarket',
                        `Item #${menu.items.length} criado com sucesso.`,
                    );
                    break;
                default:
                    broker.publish(
                        'mqtt_supermarket',
                        `Comando CREATE: argumento ${createItem} não faz parte do protocolo SDP.`,
                    );
            }
            break;
        }
        case 'finish': {
            const finishItem = args[1];
            if (!finishItem) {
                broker.publish(
                    'mqtt_supermarket',
                    "Comando FINISH: forneça um argumento 'item'.",
                );
                break;
            }
            switch (finishItem) {
                case 'pedido':
                    eventResponse = orderController.store(menu);
                    if (eventResponse.error) {
                        broker.publish(
                            'mqtt_supermarket',
                            eventResponse.response,
                        );
                        break;
                    }
                    broker.publish(
                        'mqtt_supermarket',
                        eventResponse.response,
                    );
                    break;
                default:
                    broker.publish(
                        'mqtt_supermarket',
                        `Comando FINISH: argumento ${finishItem} não faz parte do protocolo SDP.`,
                    );
            }
            break;
        }
       
        default:
            broker.publish(
                'mqtt_supermarket',
                `Comando '${command}' não faz parte do protocolo SDP.`,
            );
    }
});
