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
  eth: { Contract, getBlockNumber, getGasPrice },
  utils: { fromWei },
} = web3;

const _date = new Date();
const year = _date.getFullYear();
const utcMonth = _date.getUTCMonth();
const month = utcMonth < 11 ? `0${utcMonth + 1}` : utcMonth + 1;
const utcDate = _date.getUTCDate();
const date = utcDate < 10 ? `0${utcDate}` : utcDate;

const mostRecentSwapsFilename = path.join(
  __dirname,
  `most-recent-swaps/${year}-${month}-${date}-most-recent-swaps.js`
);

let gasPrice;

const getReadableGasPrice = async () => {
  let rawGasPrice;

  try {
    rawGasPrice = await getGasPrice();
  } catch (err) {
    console.log("d3168b1936fdda4ea020de441c07bc28", { err });
  }

  const rawGasPriceInGwei = rawGasPrice && fromWei(rawGasPrice, "gwei");
  gasPrice = rawGasPriceInGwei && parseInt(rawGasPriceInGwei, 10);
};

setInterval(async () => {
  getReadableGasPrice();
}, 90 * 1000);

const getOlderTokenSwaps = ({ blockNumber, pairContract, token0, token1 }) => {
  pairContract.getPastEvents(
    "Swap",
    { fromBlock: blockNumber - 4 * 60 * 12 },
    (err, events) => {
      if (err) {
        console.log("d300d84a8eb0951ab978039af34e4f67", { err });
      } else {
        let zeroToOneSwap, oneToZeroSwap;

        for (const event of events) {
          const _swap = formatSwap(event, true);
          const { amount0In, amount1In } = _swap || {};

          if (amount0In > 0) {
            zeroToOneSwap = _swap;
          } else if (amount1In > 0) {
            oneToZeroSwap = _swap;
          }
        }

        if (zeroToOneSwap) {
          if (mostRecentSwaps[token0]) {
            mostRecentSwaps[token0][token1] = zeroToOneSwap;
          } else {
            mostRecentSwaps[token0] = { [token1]: zeroToOneSwap };
          }
        }

        if (oneToZeroSwap) {
          if (mostRecentSwaps[token1]) {
            mostRecentSwaps[token1][token0] = oneToZeroSwap;
          } else {
            mostRecentSwaps[token1] = { [token0]: oneToZeroSwap };
          }
        }
        console.log({ oneToZeroSwap, zeroToOneSwap });

        writeMostRecentSwapsToFile();
      }

      if (pendingPastEventCalls.length > 1) {
        pendingPastEventCalls = pendingPastEventCalls.slice(1);
        getOlderTokenSwaps(pendingPastEventCalls[0]);
      }
    }
  );
};

let mostRecentSwaps = {
  /*
    [token0]: {
      [token1]: {
        ...swap data
      }
    }
  */
};

const formatSwap = (res, isOld = false) => {
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
    isOld,
  };

  return swap;
};

const writeMostRecentSwapsToFile = () => {
  const stringifiedMostRecentSwaps = JSON.stringify(mostRecentSwaps, null, 2);

  setTimeout(() => {
    fs.writeFileSync(
      mostRecentSwapsFilename,
      `module.exports = ${stringifiedMostRecentSwaps};\n`,
      (err) => {
        if (err) {
          console.log("65bff73107b5116f0246a930ce91a074", { err });
        }
      }
    );
  }, 0);
};

const shouldArb = ({ res, token0, token1 }) => {
  const swap = formatSwap(res);
  const { blockNumber: _blockNumber } = res || {};
  blockNumber = _blockNumber;

  if (mostRecentSwaps[token0]) {
    mostRecentSwaps[token0][token1] = swap;
  } else {
    mostRecentSwaps[token0] = { [token1]: swap };
  }

  writeMostRecentSwapsToFile();

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
      }
    }
  }
};

const _getBlockNumber = async () => {
  let blockNumber;

  await getBlockNumber((err, res) => {
    if (err) {
      process.exit(1);
    } else {
      blockNumber = res;
    }
  });

  return blockNumber;
};

let pendingPastEventCalls = [];

const go = async () => {
  const mostRecentSwapsFileExists = fs.existsSync(mostRecentSwapsFilename);

  if (mostRecentSwapsFileExists) {
    mostRecentSwaps = require(path.resolve(mostRecentSwapsFilename));
  }

  const blockNumber = await _getBlockNumber();
  console.log({ blockNumber });
  await getReadableGasPrice();

  const pairTokens = {};

  for (const _pair of pairs) {
    const { pair: pairAddress } = _pair;
    const pairContract = new Contract(uniswapPairAbi, pairAddress);

    let token0, token1;

    await pairContract.methods
      .token0()
      .call()
      .then((_token0) => {
        if (token0 !== ZERO_ADDRESS) {
          token0 = _token0;
        }
      })
      .catch((err) => console.log("e856a32d0b552e8c64aa08896b1748da", { err }));

    await pairContract.methods
      .token1()
      .call()
      .then((_token1) => {
        if (token1 !== ZERO_ADDRESS) {
          token1 = _token1;
        }
      })
      .catch((err) => console.log("093547cee5726047869efa655ac5e6e1", { err }));

    pairTokens[pairAddress] = { token0, token1 };

    pendingPastEventCalls.push({ blockNumber, pairContract, token0, token1 });
  }

  if (pendingPastEventCalls.length) {
    getOlderTokenSwaps(pendingPastEventCalls[0]);
  }

  for (const _pair of pairs) {
    const { pair: pairAddress } = _pair;
    const pairContract = new Contract(uniswapPairAbi, pairAddress);

    pairContract.events.Swap((err, res) => {
      if (err) {
        console.log("bcf23dfcdd1a69adfe495dc96a2af975", { err });
        return;
      }
      const { address } = res || {};
      const { token0, token1 } = pairTokens[address] || {};

      if (token0 && token1) {
        shouldArb({ res, token0, token1 });
      } else {
        console.log(`uh oh no token0 and token1 for ${address}`);
      }
    });
  }
};

go();
