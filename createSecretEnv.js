import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SecretNetworkClient, Wallet } from "secretjs";
import crypto from "crypto";

const seed = process.argv.slice(2).join(" ");

const encodedMnemonic = Buffer.from(seed).toString("base64");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, ".env");

const CHAIN = "secret-4";
const URL = "https://lcd.secret.express";

const WALLET = new Wallet(seed);
const ENTHROPY = crypto.randomBytes(64).toString("base64");
const CONTRACT_ADDRESS = "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek";
const EXEC_INPUT_MSG = {
  msg: {
    create_viewing_key: {
      entropy: ENTHROPY,
    },
  },
};

const secretjs = new SecretNetworkClient({
  chainId: CHAIN,
  url: URL,
  wallet: WALLET,
  walletAddress: WALLET.address,
});

const info = async () => {
  const contract_hash = await secretjs.query.compute.codeHashByContractAddress({
    contract_address: CONTRACT_ADDRESS,
  });

  return secretjs.tx.compute.executeContract({
    sender: WALLET.address,
    contract_address: CONTRACT_ADDRESS,
    code_hash: contract_hash.code_hash,
    msg: EXEC_INPUT_MSG,
  });
};

info()
  .then((i) => {
    return JSON.parse(Buffer.from(i.data[0]).toString("utf-8"));
  })
  .then((key) => {
    fs.readFile(envPath, "utf8", function (err, data) {
      if (err) {
        return console.log(err);
      }

      const envObj = {
        __MNEMONIC_PLACEHOLDER__: encodedMnemonic,
        __APIKEY_PLACEHOLDER__: key,
      };

      const replacer = new RegExp(Object.keys(envObj).join("|"), "g");

      var result = data.replace(replacer, (matched) => envObj[matched]);

      fs.writeFile(envPath, result, "utf8", function (err) {
        if (err) return console.log(err);
      });
    });
  })
  .catch((e) => console.error(e));
