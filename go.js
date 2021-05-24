const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

const decimals = require("./decimals.js");
const pairs = require("./pairs.js");
const uniswapPairAbi = require("./abis/uniswapPair.js");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const RIGHT = "right";
const LEFT = "left";

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

let currentBlockNumber;

setInterval(async () => {
  getReadableGasPrice();
}, 30 * 1000);

let mostRecentSwaps = {
  /*
    [token0]: {
      [token1]: {
        ...swap data
      }
    }
  */
};

const formatSwap = ({ res, token0, token1 }) => {
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
    token0,
    token1,
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
  const swap = formatSwap({ res, token0, token1 });

  const { blockNumber: _blockNumber } = res || {};
  currentBlockNumber = _blockNumber;

  const swapDirection = swap.amount0In > 0 ? RIGHT : LEFT;

  let tokenZero;
  let tokenOne;

  if (swapDirection === RIGHT) {
    if (mostRecentSwaps[token0]) {
      mostRecentSwaps[token0][token1] = swap;
    } else {
      mostRecentSwaps[token0] = { [token1]: swap };
    }

    tokenZero = token0;
    tokenOne = token1;
  }

  if (swapDirection === LEFT) {
    if (mostRecentSwaps[token1]) {
      mostRecentSwaps[token1][token0] = swap;
    } else {
      mostRecentSwaps[token1] = { [token0]: swap };
    }

    tokenZero = token1;
    tokenOne = token0;
  }

  const mostRecentSwapsTokenZero = mostRecentSwaps[tokenZero] || {};
  const mostRecentSwapsTokenOne = mostRecentSwaps[tokenOne] || {};

  writeMostRecentSwapsToFile();

  for (const tokenTwo in mostRecentSwapsTokenOne) {
    const mostRecentSwapsTokenTwo = mostRecentSwaps[tokenTwo] || {};

    for (const tokenThree in mostRecentSwapsTokenTwo) {
      if (tokenThree === tokenZero) {
        const zeroToOne = mostRecentSwapsTokenZero[tokenOne];
        const oneToTwo = mostRecentSwapsTokenOne[tokenTwo];
        const twoToZero = mostRecentSwapsTokenTwo[tokenZero];

        const _isTriangularArbOpp = isTriangularArbOpp({
          zeroToOne,
          oneToTwo,
          twoToZero,
        });

        if (_isTriangularArbOpp) {
          // TODO: call the contract
          console.log(
            "🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐🪐"
          );
        }
      }
    }
  }
};

const getSwapAmountsAndDirection = ({ swap }) => {
  return swap.amount0In > 0
    ? [swap.amount0In, swap.amount1Out, RIGHT]
    : [swap.amount1In, swap.amount0Out, LEFT];
};

const getSwapTokenInAndOut = ({ direction, swap }) => {
  return direction === RIGHT
    ? [swap.token0, swap.token1]
    : [swap.token1, swap.token0];
};

const getSwapExchangeRate = ({ amountIn, amountOut, tokenIn, tokenOut }) => {
  const { [tokenIn]: tokenInDecimals, [tokenOut]: tokenOutDecimals } =
    decimals || {};

  const adjustedAmountIn = amountIn * 10 ** (18 - tokenInDecimals);
  const adjustedAmountOut = amountOut * 10 ** (18 - tokenOutDecimals);

  return adjustedAmountOut / adjustedAmountIn;
};

const isTriangularArbOpp = ({ zeroToOne, oneToTwo, twoToZero }) => {
  console.log({
    zeroToOne,
    oneToTwo,
    twoToZero,
  });

  const GAS_PRICE_THRESHOLD = 40;
  const SWAP_AGE_THRESHOLD = 10;
  const ROUND_TRIP_RATE_THRESHOLD = 1.2;

  if (!zeroToOne || !oneToTwo || !twoToZero) {
    console.log("your business is all undefined friend");
    return false;
  }

  let tooOld = false;
  let tooExpensive = false;

  if (zeroToOne.gasPrice > 40) {
    tooExpensive = true;
  }

  if (
    currentBlockNumber - SWAP_AGE_THRESHOLD > zeroToOne.blockNumber ||
    currentBlockNumber - SWAP_AGE_THRESHOLD > oneToTwo.blockNumber ||
    currentBlockNumber - SWAP_AGE_THRESHOLD > twoToZero.blockNumber
  ) {
    tooOld = true;
  }

  const [zeroToOneAmountIn, zeroToOneAmountOut, zeroToOneDirection] =
    getSwapAmountsAndDirection({ swap: zeroToOne });
  const [zeroToOneTokenIn, zeroToOneTokenOut] = getSwapTokenInAndOut({
    direction: zeroToOneDirection,
    swap: zeroToOne,
  });
  const zeroToOneExchangeRate = getSwapExchangeRate({
    amountIn: zeroToOneAmountIn,
    amountOut: zeroToOneAmountOut,
    direction: zeroToOneDirection,
    tokenIn: zeroToOneTokenIn,
    tokenOut: zeroToOneTokenOut,
  });

  const [oneToTwoAmountIn, oneToTwoAmountOut, oneToTwoDirection] =
    getSwapAmountsAndDirection({ swap: oneToTwo });
  const [oneToTwoTokenIn, oneToTwoTokenOut] = getSwapTokenInAndOut({
    direction: oneToTwoDirection,
    swap: oneToTwo,
  });
  const oneToTwoExchangeRate = getSwapExchangeRate({
    amountIn: oneToTwoAmountIn,
    amountOut: oneToTwoAmountOut,
    direction: oneToTwoDirection,
    tokenIn: oneToTwoTokenIn,
    tokenOut: oneToTwoTokenOut,
  });

  const [twoToZeroAmountIn, twoToZeroAmountOut, twoToZeroDirection] =
    getSwapAmountsAndDirection({ swap: twoToZero });
  const [twoToZeroTokenIn, twoToZeroTokenOut] = getSwapTokenInAndOut({
    direction: twoToZeroDirection,
    swap: twoToZero,
  });
  const twoToZeroExchangeRate = getSwapExchangeRate({
    amountIn: twoToZeroAmountIn,
    amountOut: twoToZeroAmountOut,
    direction: twoToZeroDirection,
    tokenIn: twoToZeroTokenIn,
    tokenOut: twoToZeroTokenOut,
  });

  const roundTripRate =
    zeroToOneExchangeRate * oneToTwoExchangeRate * twoToZeroExchangeRate;

  // TODO: bail earlier if tooOld or tooExpensive -- want to watch for now
  const isArbOpp =
    roundTripRate > ROUND_TRIP_RATE_THRESHOLD && !tooOld && !tooExpensive;

  console.log({
    isArbOpp,
    roundTripRate,
    ROUND_TRIP_RATE_THRESHOLD,
    tooOld,
    tooExpensive,
    zeroToOneExchangeRate,
    oneToTwoExchangeRate,
    twoToZeroExchangeRate,
  });

  return isArbOpp;
};

const go = async () => {
  const mostRecentSwapsFileExists = fs.existsSync(mostRecentSwapsFilename);

  if (mostRecentSwapsFileExists) {
    mostRecentSwaps = require(path.resolve(mostRecentSwapsFilename));
  }

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
