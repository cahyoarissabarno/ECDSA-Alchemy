const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const {secp256k1} = require("ethereum-cryptography/secp256k1");
const {keccak256} = require("ethereum-cryptography/keccak");
const {toHex} = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "634f125a5583ea618ffb5101fb1750d115b82b029489aab7c52bf7d69e9935ad": 100,
  "28d0eb7a448a0741a5fd4d2141811886c4e426450137e7dcb9cbd511605ed697": 50,
  "cf1833ea6fb60521085ff47ea673fe00d3dd9697d0978563076d9f8b27ee5a86": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  console.log(req.body)
  const { signature, recipient, amount, message, sender } = req.body;

  // make sign init to accesss recoverPublicKey that missing when send to API
  const Signature = secp256k1.sign(message,'634f125a5583ea618ffb5101fb1750d115b82b029489aab7c52bf7d69e9935ad')  

  // Set value 
  Signature.r = BigInt(signature.r)
  Signature.s = BigInt(signature.s)
  Signature.recovery = signature.recovery

  // console.log(Signature)

  //Generate Address
  const signerPublicKey = Signature.recoverPublicKey(message).toRawBytes()
  const signerAddress = toHex(keccak256(signerPublicKey.slice(1)).slice(-20))

  const senderPublicKey = secp256k1.getPublicKey(sender)
  const senderAddress = toHex(keccak256(senderPublicKey.slice(1)).slice(-20))

  // Verify Transaction
  if(signerAddress == senderAddress){
    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
