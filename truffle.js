module.exports = {
  build: {
    "index.html": "index.html",
      "attestation.html": "attestation.html",
      "addAttestation.html": "addAttestation.html",
      "verify.html": "verify.html",
    "app.js": [
      "javascripts/app.js"
    ],
      "add.js":"javascripts/add.js",
      "ipfs.js":"javascripts/ipfs.js",
      "verify.js":"javascripts/verify.js",
      "browser-solc.min.js":"javascripts/browser-solc.min.js",
      "app.css": [
      "stylesheets/app.css"
    ],
    "images/": "images/"
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};
