const database = require("./datbase");

module.exports = function printInventory(inputs) {
    const idAndCount = mapInputsToIdAndCount(inputs);
    const purchasedItems = purchasing(idAndCount);
    const freeItems = getFreeItem(idAndCount);
    const inventory = getInventory(purchasedItems, freeItems);
    console.log(inventory)
};

const mapInputsToIdAndCount = (inputs) => {
    return inputs.reduce((acc, cur) => {
        let count = cur.includes("-") ? cur.substring(cur.indexOf("-") + 1) : 1;
        cur = cur.includes("-") ? cur.substring(0, cur.indexOf("-")) : cur;
        cur in acc ? acc[cur] += count : acc[cur] = count;
        return acc;
    }, {});
}

const purchasing = (idAndCount) => {
    return Object.keys(idAndCount).map(id => {
        let item = getItemById(id);
        item.count = idAndCount[id];
        return item;
    })
}

const getFreeItem = (idAndCount) => {
    return database.loadPromotions()[0].barcodes.filter(
        id => Object.keys(idAndCount).includes(id) && idAndCount[id] > 2)
        .map(id => {
            let item = getItemById(id);
            item.count = Math.floor(idAndCount[id] / 3);
            return item;
        });
}

const getInventory = (items, free) => {
    const totalItemPrice = items.reduce((acc, cur) => acc + cur.count * cur.price, 0);
    const discount = free.reduce((acc, cur) => acc + cur.count * cur.price, 0);
    const header = '***<没钱赚商店>购物清单***\n';
    const delimiter = '----------------------\n';
    const freeItemTitle = '挥泪赠送商品：\n';
    const footer = "**********************";
    let inventory = header;
    items.map(item => {
        const freeItem = free.filter(cur => cur.barcode === item.barcode);
        item.payCount = item.count - (freeItem.length > 0 ? freeItem[0].count : 0);
        return item;
    })
    inventory += items.reduce((acc, cur) => {
        return acc + `名称：${cur.name}，数量：${cur.count}${cur.unit}，单价：${cur.price.toFixed(2)}(元)，小计：${(cur.price * cur.payCount).toFixed(2)}(元)\n`
    }, "");
    inventory += delimiter + freeItemTitle;
    inventory += free.reduce((acc, cur) => acc + `名称：${cur.name}，数量：${cur.count}${cur.unit}\n`, "");
    inventory += delimiter;
    inventory += `总计：${(totalItemPrice - discount).toFixed(2)}(元)\n`;
    inventory += `节省：${discount.toFixed(2)}(元)\n`;
    inventory += footer;
    return inventory;
}

const getItemById = (id) => {
    return database.loadAllItems().filter(item => item.barcode === id).pop();
}