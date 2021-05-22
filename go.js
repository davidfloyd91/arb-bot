const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

const pairs = require("./pairs.js");
const uniswapPairAbi = require("./abis/uniswapPair.js");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const { WEB3_INFURA_PROJECT_ID } = process.env;

const wsUrl = `wss://mainnet.infura.io/ws/v3/${WEB3_INFURA_PROJECT_ID}`;

const {
  providers: { WebsocketProvider },
} = Web3;

const wsOptions = {
  reconnect: {
    auto: true,
    delay: 5000,
    maxAttempts: 5,
    onTimeout: false,
  },
};

const wsProvider = new WebsocketProvider(wsUrl, wsOptions);
const web3 = new Web3(wsProvider);

const {
  eth: { Contract, getGasPrice },
  utils: { fromWei },
} = web3;

let gasPrice;

const getReadableGasPrice = async () => {
  let rawGasPrice;

  try {
    rawGasPrice = await getGasPrice();
  } catch (err) {
    console.log({ err });
  }

  const rawGasPriceInGwei = rawGasPrice && fromWei(rawGasPrice, "gwei");
  gasPrice = rawGasPriceInGwei && parseInt(rawGasPriceInGwei, 10);
};

setInterval(async () => {
  getReadableGasPrice();
}, 90 * 1000);

const mostRecentSwaps = {
  /*
    [token0]: {
      [token1]: {
        ...swap data
      }
    }
  */
};

const shouldArb = ({ res, token0, token1 }) => {
  const { address, blockHash, blockNumber, returnValues, transactionHash } =
    res || {};
  const { amount0In, amount1In, amount0Out, amount1Out } = returnValues || {};

  const swap = {
    address,
    amount0In: parseInt(amount0In, 10),
    amount1In: parseInt(amount1In, 10),
    amount0Out: parseInt(amount0Out, 10),
    amount1Out: parseInt(amount1Out, 10),
    blockHash,
    blockNumber,
    transactionHash,
    gasPrice,
  };

  if (mostRecentSwaps[token0]) {
    mostRecentSwaps[token0][token1] = swap;
  } else {
    mostRecentSwaps[token0] = { [token1]: swap };
  }

  const stringifiedMostRecentSwaps = JSON.stringify(mostRecentSwaps, null, 2);

  setTimeout(() => {
    const _date = new Date();
    const year = _date.getFullYear();
    const utcMonth = _date.getUTCMonth();
    const month = utcMonth < 11 ? `0${utcMonth + 1}` : utcMonth + 1;
    const utcDate = _date.getUTCDate();
    const date = utcDate < 10 ? `0${utcDate}` : utcDate;

    const filename = path.join(
      __dirname,
      `most-recent-swaps/${year}-${month}-${date}-most-recent-swaps.js`
    );

    fs.writeFileSync(
      filename,
      `module.exports = ${stringifiedMostRecentSwaps};\n`,
      (err) => {
        if (err) {
          console.log({ err });
        }
      }
    );
  }, 0);

  const mostRecentSwapsToken1 = mostRecentSwaps[token1] || {};

  for (const token2 in mostRecentSwapsToken1) {
    const mostRecentSwapsToken2 = mostRecentSwaps[token2] || {};

    for (const token3 in mostRecentSwapsToken2) {
      console.log({
        token0,
        token1,
        token2,
        token3,
        now: new Date(),
        gasPrice,
      });

      if (token3 === token0) {
        const spaceMoneyAlert =
          "🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐";
        console.log({ spaceMoneyAlert });

        fs.writeFileSync(
          path.join(__dirname, `victory.js`),
          spaceMoneyAlert,
          (err) => {
            if (err) {
              console.log({ err });
            }
          }
        );
      }
    }
  }
};

const go = async () => {
  await getReadableGasPrice();

  for (const _pair of pairs) {
    const { pair: pairAddress } = _pair;
    const pairContract = new Contract(uniswapPairAbi, pairAddress);

    let token0, token1;

    pairContract.methods
      .token0()
      .call()
      .then((_token0) => {
        if (token0 !== ZERO_ADDRESS) {
          token0 = _token0;
        }
      })
      .catch((err) => console.log({ err }));

    pairContract.methods
      .token1()
      .call()
      .then((_token1) => {
        if (token1 !== ZERO_ADDRESS) {
          token1 = _token1;
        }
      })
      .catch((err) => console.log({ err }));

    pairContract.events.Swap((err, res) => {
      if (err) {
        console.log({ err });
        return;
      }

      shouldArb({ res, token0, token1 });
    });
  }
};

go();
