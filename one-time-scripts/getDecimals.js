const fs = require("fs");

const tokenList = require("../uniswapDefaultTokenList.js");
const { tokens } = tokenList;

const decimals = {};

const go = () => {
  for (let i = 0; i < tokens.length; i++) {
    const { address, decimals: _decimals } = tokens[i] || {};
    decimals[address] = _decimals;
  }

  try {
    fs.writeFileSync(
      "decimals.js",
      `module.exports = ${JSON.stringify(decimals)};`,
      "utf-8"
    );
  } catch (err) {
    console.log({ err });
  }
};

go();
