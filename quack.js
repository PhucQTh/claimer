const TELEGRAM_USER = require('./token.json');
const MAX_DUCK = 17;
const MAX_DUCK_RARITY = 5;
let ACCESS_TOKEN = TELEGRAM_USER.state.token;

let listColect = [];
let listDuck = [];
let listReward = [];
let listHatch = [];
let listRemoveDuck = [];
let time_to_golden_duck = 0;
Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
};

async function getTotalEgg() {
    try {
        let response = await fetch('https://api.quackquack.games/balance/get', {
            headers: {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                authorization: 'Bearer ' + ACCESS_TOKEN,
            },
            body: null,
            method: 'GET',
        });
        let data = await response.json();
        // console.log(data);
        if (data.error_code !== '') console.log(data.error_code);

        let egg = 0,
            fog = 0;
        data.data.data.map((item) => {
            if (item.symbol === 'PET') fog = item.balance;
            if (item.symbol === 'EGG') egg = item.balance;
        });

        console.clear();
        console.log(`-----------------------------------`);
        let minute = Math.floor((time_to_golden_duck - Date.now()) / 1e3 / 60);
        let second = Number(
            ((time_to_golden_duck - Date.now()) / 1e3) % 60
        ).toFixed(0);
        console.log(`🐥 in ${minute} minutes - ${second} seconds `);
        listReward.map((item) =>
            console.log(`🐥 ${item.amount} ${item.label}`)
        );
        console.info(`🐸: ${fog} || 🥚: ${egg} `);
        console.log(`-----------------------------------`);
        getListCollectEgg();
    } catch (error) {
        // console.log("getTotalEgg", error);
        console.log('Mat ket noi getTotalEgg, thu lai sau 3s');
        setTimeout(getTotalEgg, 3e3);
    }
}

async function getListCollectEgg() {
    try {
        listColect = [];
        listDuck = [];

        let response = await fetch(
            'https://api.quackquack.games/nest/list-reload',
            {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                    authorization: 'Bearer ' + ACCESS_TOKEN,
                },
                body: null,
                method: 'GET',
            }
        );
        let data = await response.json();
        // console.log(data);
        if (data.error_code !== '') console.log(data.error_code);
        data.data.duck &&
            (listDuck = data.data.duck.filter(
                (item) => item.total_rare > MAX_DUCK_RARITY - 1
            ));

        // listDuck.filter((item) => item.total_rare > 4);
        listRemoveDuck = data.data.duck.filter(
            (item) => item.total_rare === MAX_DUCK_RARITY - 1
        );
        listColect = data.data.nest.filter((item) => item.type_egg < 4);
        listHatch = data.data.nest.filter((item) => item.type_egg > 3);
        let eggs = listColect.map((i) => i.id);
        if (listRemoveDuck.length > 0) {
            console.log(`Duck can remove: ${listRemoveDuck.length}`);
            await removeDuck();
        }
        if (listColect.length > 0) {
            console.log(`So 🥚 co the thu thap: ${listColect.length}`, eggs);
            collect();
        }

        if (listHatch.length > 0) {
            console.log(`Eggs can hatch: ${listHatch.length}`);
            hatchEgg();
        }
    } catch (error) {
        // console.log("getListCollectEgg error:", error);
        console.log('Mat ket noi getListCollectEgg, thu lai sau 3s');
        setTimeout(getListCollectEgg, 3e3);
    }
}

const hatchEgg = async () => {
    try {
        const egg = listHatch[0];
        let response = await fetch('https://api.quackquack.games/nest/hatch', {
            headers: {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                authorization: 'Bearer ' + ACCESS_TOKEN,
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: 'nest_id=' + egg.id,
            method: 'POST',
        });
        let { data } = await response.json();
        console.log(data);
        const time_claim = data['time_claim'];
        const time_to_claim = time_claim - Date.now();
        setTimeout(() => {
            collectDuck(egg.id);
        }, time_to_claim);
    } catch (error) {
        console.log('Mat ket noi hatch, thu lai sau 3s');
        // setTimeout(hatch, 3e3);
    }
};
const collectDuck = (nestId) => {
    try {
        fetch('https://api.quackquack.games/nest/collect-duck', {
            headers: {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                authorization: 'Bearer ' + ACCESS_TOKEN,
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: 'nest_id=' + nestId,
            method: 'POST',
        });
    } catch (error) {
        // console.log("hatch error:", error);
        console.log('Mat ket noi hatch, thu lai sau 3s');
        // setTimeout(hatch, 3e3);
    }
};
const removeDuck = () => {
    try {
        listRemoveDuck = listRemoveDuck.map(async (item) => {
            const res = await fetch(
                'https://api.quackquack.games/duck/remove',
                {
                    headers: {
                        accept: '*/*',
                        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                        authorization: 'Bearer ' + ACCESS_TOKEN,
                        'content-type': 'application/x-www-form-urlencoded',
                    },
                    body: `ducks=%7B+%22ducks%22%3A+%5B%22${item.id}%22%5D+%7D`,
                    method: 'POST',
                }
            );
        });
    } catch (error) {}
};
const collect = async () => {
    if (listColect.length === 0) {
        return getTotalEgg();
    }

    const egg = listColect.shift();
    let data;
    try {
        data = await fetch('https://api.quackquack.games/nest/collect', {
            headers: {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                authorization: 'Bearer ' + ACCESS_TOKEN,
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: 'nest_id=' + egg.id,
            method: 'POST',
        }).then((res) => res.json());
    } catch (error) {
        console.log('Mat ket noi collect, thu lai sau 3s');
        await new Promise((resolve) => setTimeout(resolve, 3e3));
        return collect();
    }

    if (data.error_code !== '') {
        console.log(data.error_code);
        return collect();
    }

    const duck = getDuckToLay();
    layEgg(egg, duck);
};

function getDuckToLay() {
    let duck = null;
    let now = Number((Date.now() / 1e3).toFixed(0));

    listDuck.forEach((duck) => {
        if (duck.last_active_time < now) now = duck.last_active_time;
    });
    duck = listDuck.find((item) => item.last_active_time === now);

    return duck;
}

async function layEgg(egg, duck) {
    try {
        // console.log(`${duck.id}:${egg.id}`);

        let response = await fetch(
            'https://api.quackquack.games/nest/lay-egg',
            {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                    authorization: 'Bearer ' + ACCESS_TOKEN,
                    'content-type': 'application/x-www-form-urlencoded',
                },
                body: 'nest_id=' + egg.id + '&duck_id=' + duck.id,
                method: 'POST',
            }
        );
        let data = await response.json();
        if (data.error_code !== '') {
            console.log(data.error_code);
            const duck = getDuckToLay();
            layEgg(egg, duck);
        } else {
            console.log(`Da thu thap 🥚 ${egg.id}`);
            listColect.shift();
            listDuck = listDuck.filter((d) => d.id !== duck.id);
            setTimeout(collect, 3e3);
        }
    } catch (error) {
        // console.log("layEgg error:", error);
        console.log('Mat ket noi layEgg, thu lai sau 3s');
        setTimeout(() => {
            layEgg(egg, duck);
        }, 3e3);
    }
}

setInterval(() => console.clear(), 3e5);

async function getGoldDuckInfo() {
    try {
        let response = await fetch(
            'https://api.quackquack.games/golden-duck/info',
            {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                    authorization: 'Bearer ' + ACCESS_TOKEN,
                },
                body: null,
                method: 'GET',
            }
        );
        let data = await response.json();

        if (data.error_code !== '') console.log(data.error_code);

        console.log(``);
        if (data.data.time_to_golden_duck !== 0) {
            let nextGoldDuck = data.data.time_to_golden_duck;
            console.log(
                `🐥 xuat hien sau: ${Number(nextGoldDuck / 60).toFixed(0)}`
            );
            time_to_golden_duck = nextGoldDuck * 1e3 + Date.now();
            setTimeout(getGoldDuckInfo, nextGoldDuck * 1e3);
        } else getGoldDuckReward();
    } catch (error) {
        // console.log("getGoldDuckInfo error", error);
        console.log('Mat ket noi getGoldDuckInfo, thu lai sau 3s');
        setTimeout(getGoldDuckInfo, 3e3);
    }
}

async function getGoldDuckReward() {
    try {
        let response = await fetch(
            'https://api.quackquack.games/golden-duck/reward',
            {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                    authorization: 'Bearer ' + ACCESS_TOKEN,
                },
                body: null,
                method: 'GET',
            }
        );
        let data = await response.json();
        // console.log(data);

        if (data.error_code !== '') console.log(data.error_code);

        if (data.data.type === 0) {
            console.log(`🐥 Chuc ban may man lan sau`);
            getGoldDuckInfo();
        }

        if (data.data.type === 2 || data.data.type === 3)
            claimGoldDuck(data.data);
    } catch (error) {
        // console.log("getGoldDuckReward error", error);
        console.log('Mat ket noi getGoldDuckReward, thu lai sau 3s');
        setTimeout(getGoldDuckReward, 3e3);
    }
}

function infoGoldDuck(data) {
    if (data.type === 1) return { label: 'TON', amount: data.amount };
    if (data.type === 2) return { label: 'PEPET', amount: data.amount };
    if (data.type === 3) return { label: 'EGG', amount: data.amount };
    if (data.type === 4) return { label: 'TRU', amount: data.amount };
}

async function claimGoldDuck(gDuck) {
    try {
        let response = await fetch(
            'https://api.quackquack.games/golden-duck/claim',
            {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                    authorization: 'Bearer ' + ACCESS_TOKEN,
                    'content-type': 'application/x-www-form-urlencoded',
                },
                body: 'type=1',
                method: 'POST',
            }
        );
        let data = await response.json();
        // console.log(data);

        if (data.error_code !== '') console.log(data.error_code);

        let info = infoGoldDuck(gDuck);
        listReward.push(info);
        console.log(`🐥 ${info.amount} ${info.label}`);
        console.log();

        getGoldDuckInfo();
    } catch (error) {
        // console.log("claimGoldDuck error", error);
        console.log('Mat ket noi claimGoldDuck, thu lai sau 3s');
        setTimeout(claimGoldDuck, 3e3);
    }
}

const express = require('express');
const app = express();
const port = 4000;

app.get('/get-rewards', (req, res) => {
    res.send(listReward);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    getGoldDuckInfo().then(getTotalEgg);
});
