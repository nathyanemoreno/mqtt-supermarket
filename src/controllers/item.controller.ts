export const itemController = {
    store: function (params: string[]) {
        const itemPrice = params.pop();
        if (!itemPrice) {
            return {
                response: 'Comando CREATE: forneça um preço ao item.',
                error: 'MISSING_ARGUMENT',
            };
        }

        const price = parseFloat(itemPrice.replace(',', '.'));
        if (isNaN(price)) {
            return {
                response: `Comando CREATE: o preço do item precisa ser um número.`,
                error: 'INVALID_ARGUMET_TYPE',
            };
        }

        params.shift();

        const itemName = params.join(' ');

        return {
            data: {
                name: itemName,
                price_br: price,
            },
        };
    },
    delete: function (menu: Record<string, any>, params: string[]) {
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
        menu.items = menu.items.filter((_: any, i: any) => itemIdNumber !== i);
        return {
            response: `Item #${1 + itemIdNumber} deletado com sucesso.`,
        };
    },
};
