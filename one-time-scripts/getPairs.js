const Web3 = require("web3");
const fs = require("fs");

const tokenList = require("../uniswapDefaultTokenList.js");
const uniswapV2FactoryAbi = require("../abis/uniswapV2Factory.js");

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
  eth: { Contract },
} = web3;

const uniswapV2Factory = new Contract(
  uniswapV2FactoryAbi,
  "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
);

const { tokens } = tokenList;

const pairs = [];
const uniquePairs = {};

const go = () => {
  for (let i = 0; i < tokens.length; i++) {
    const tokenA = tokens[i]?.address;

    for (let j = 1; j < tokens.length + 1; j++) {
      const _tokenB = j < tokens.length ? tokens[j] : tokens[0];
      const tokenB = _tokenB?.address;

      uniswapV2Factory.methods
        .getPair(tokenA, tokenB)
        .call()
        .then((pair) => {
          if (
            pair !== "0x0000000000000000000000000000000000000000" &&
            !uniquePairs[pair]
          ) {
            uniquePairs[pair] = true;
            pairs.push({ tokenA, tokenB, pair });
          }
        })
        .catch(() => {})
        .finally(() => {
          if (i == tokens.length - 1 && j == tokens.length) {
            console.log({ pairs });
            try {
              fs.writeFileSync(
                "pairs.js",
                `module.exports = ${JSON.stringify(pairs)}`,
                "utf-8"
              );
            } catch (err) {
              console.log({ err });
            }
            console.log("dun 🥝");
          }
        });
    }
  }
};

go();
