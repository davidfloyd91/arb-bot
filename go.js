import Web3 from "web3";

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
  eth: { Contract, getBlockNumber, subscribe },
} = web3;

const go = async () => {};

try {
  go();
} catch (err) {
  console.log({ err });
}
