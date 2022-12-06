type Menu = {
    items: {
        name: string;
        price_br: number;
    }[];
};
type Order = {
    items: Array<{
        itemId: number;
        amount: number;
    }>;
};
let orders: Array<Order> = [];
let order: Order = { items: [] };

export const orderController = {
    prepare: function () {
        if (order.items != null) {
            order.items = [];
            return {
                response: `Pedido reiniciado.`,
            };
        }
        order.items = [];
        return {
            response: `Pedido iniciado com sucesso.`,
        };
    },
    store: function ({ items }: Menu) {
        if (!order.items) {
            return {
                response: `Comando FINISH: nenhum pedido em andamento. Inicie um pedido com o comando CREATE.`,
                error: 'BAD_REQUEST',
            };
        }
        orders.push(order);
        order = { items: [] };
        return {
            response: `Pedido #${orders.length} realizado com sucesso`,
            data: orders[orders.length - 1],
        };
    },
    show: function (index?: string) {
        if (!index) {
            if (!order.items) {
                return {
                    response: `Comando SHOW: nenhum pedido em andamento. Inicie um pedido com o comando CREATE.`,
                    error: 'BAD_REQUEST',
                };
            }

            return {
                data: order,
            };
        }

        const orderIdNumber = parseInt(index);
        if (isNaN(orderIdNumber)) {
            return {
                response: `Comando SHOW: o número do pedido precisa ser do tipo inteiro.`,
                error: 'INVALID_ARGUMET_TYPE',
            };
        } else {
            if (orderIdNumber > orders.length) {
                return {
                    response: `Comando SHOW: pedido ${orderIdNumber} não encontrado.`,
                    error: 'NOT_FOUND',
                };
            } else {
                return {
                    data: orders[orderIdNumber - 1],
                };
            }
        }
    },
    index: function () {
        return { data: orders };
    },
    update: function ({ items }: Menu, params: string[]) {
        if (!order.items) {
            return {
                response: `Comando ADD: nenhum pedido em andamento. Inicie um pedido com o comando CREATE.`,
                error: 'BAD_REQUEST',
            };
        }
        const itemId = params[1];

        if (!itemId) {
            return {
                response: `Comando ADD: nenhum item informado.`,
                error: 'BAD_REQUEST',
            };
        }
        let itemIdNumber = parseInt(itemId);
        if (isNaN(itemIdNumber)) {
            return {
                response: `Comando ADD: o número do item precisa ser do tipo inteiro.`,
                error: 'INVALID_ARGUMET_TYPE',
            };
        } else {
            if (itemIdNumber > items.length) {
                return {
                    response: `Comando ADD: item ${itemIdNumber} não encontrado.`,
                    error: 'NOT_FOUND',
                };
            }
        }
        itemIdNumber -= 1;

        const itemAmountParam = params[2];
        let itemAmount = parseFloat(itemAmountParam);

        if (itemAmountParam) {
            if (isNaN(itemAmount)) {
                return {
                    response: `Comando ADD: o número do item precisa ser do tipo inteiro.`,
                    error: 'INVALID_ARGUMET_TYPE',
                };
            }
        } else {
            itemAmount = 1;
        }

        let isNew = true;
        for (const orderItem of order.items) {
            if (orderItem.itemId === itemIdNumber) {
                orderItem.amount += itemAmount;
                isNew = false;
                break;
            }
        }

        if (isNew) {
            order.items.push({
                itemId: itemIdNumber,
                amount: itemAmount,
            });
        }

        return {
            response: `Item adicionado com sucesso.`,
        };
    },
    delete: function (params: string[]) {
        const itemId = params[1];

        if (!itemId) {
            return {
                response: `Comando DELETE: nenhum item informado.`,
                error: 'BAD_REQUEST',
            };
        }
        let itemIdNumber = parseInt(itemId);
        if (isNaN(itemIdNumber)) {
            return {
                response: `Comando DELETE: o número do item precisa ser do tipo inteiro.`,
                error: 'INVALID_ARGUMET_TYPE',
            };
        }
        itemIdNumber -= 1;

        if (order.items) {
            order.items = order.items.filter((i) => i.itemId !== itemIdNumber);
        }
        orders = orders.filter((order) => {
            let keep = true;
            for (const orderItem of order.items) {
                if (orderItem.itemId === itemIdNumber) {
                    keep = false;
                    break;
                }
            }
            return keep;
        });
    },
};
