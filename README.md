## Synopsis
A simple module for creating, managing and using Ethereum accounts in browser.

## About

While Mist is sitll in development, there is a need to safley manage Ethereum accounts client-side and in browsers like Chrome. This module allows the secure generation of Ethereum accounts and the functionality to override web3.js when these stored accounts are being used by dApps.

## Installation

### Node.js

```
$ npm install ethereumjs-accounts
```
  
### Meteor.js

```
$ coming soon...
```

## Usage

Require the NPM module or use the standalone browserified version where the 'Accounts' object is global.

```javascript
var Accounts = require('ethereumjs-accounts');
var accounts = new Accounts({minPassphraseLength: 6}); // or new Accounts(..) if using dist.

// Generate a new account encrypted with a passphrase
var accountObject = accounts.new('myPassphrase');

/* console.log(accountsObject); // returns {accountObject}:
{
  "address": "0x169aab499b549eac087035e640d3f7d882ef5e2d",
  "encrypted": true,
  "locked": true,
  "hash": "342f636d174cc1caa49ce16e5b257877191b663e0af0271d2ea03ac7e139317d",
  "private": "U2FsdGVkX19ZrornRBIfl1IDdcj6S9YywY8EgOeOtLj2DHybM/CHL4Jl0jcwjT+36kDnjj+qEfUBu6J1mGQF/fNcD/TsAUgGUTEUEOsP1CKDvNHfLmWLIfxqnYHhHsG5",
  "public": "U2FsdGVkX19EaDNK52q7LEz3hL/VR3dYW5VcoP04tcVKNS0Q3JINpM4XzttRJCBtq4g22hNDrOR8RWyHuh3nPo0pRSe9r5AUfEiCLaMBAhI16kf2KqCA8ah4brkya9ZLECdIl0HDTMYfDASBnyNXd87qodt46U0vdRT3PppK+9hsyqP8yqm9kFcWqMHktqubBE937LIU0W22Rfw6cJRwIw=="
}
*/

// Get and decrypt an account stored in browser
var accountObject = accounts.get('0x169aab499b549eac087035e640d3f7d882ef5e2d', 'myPassphrase');

/* console.log(accountsObject); // returns {accountObject} unlocked:
{
  "address": "0x169aab499b549eac087035e640d3f7d882ef5e2d",
  "encrypted": true,
  "locked": false,
  "hash": "342f636d174cc1caa49ce16e5b257877191b663e0af0271d2ea03ac7e139317d",
  "private": "beab6210b7bbcc121c941832c9f944e7e755a836a23b23ee239b8f9a495c95f3",
  "public": "72f4b266d09f8b00a175a65e2448911c62680d18c9493a841f2b97ed61c187dad658a77ae9fdc61012a7064fdce0d2952cd0bdd04e00bc812e71efd8e0bc7e1e"
}
*/

// Return all accounts stored in browser
var accounts = accounts.get();

// Extend the web3.js object
accounts.extendWeb3();

```

## API

- [`Accounts`](#accounts)
    - [`new Accounts([options])`](#new-accounts)
    - [`Accounts` Properties](#accounts-properties)
    - [`Accounts` Methods](#accounts-methods)
        - [`Accounts.new(passphrase)`](#method-new) 
        - [`Accounts.get(address[, passphrase])`](#method-get) 
        - [`Accounts.set(address, accountObject)`](#method-set) 
        - [`Accounts.isPassphrase(passphrase)`](#method-isPassphrase) 
        - [`Accounts.remove(address)`](#method-remove) 
        - [`Accounts.clear()`](#method-clear) 
        - [`Accounts.contains(address)`](#method-clear) 
        - [`Accounts.contains(address)`](#method-contains) 
        - [`Accounts.length()`](#method-length) 
        - [`Accounts.extendWeb3()`](#method-extendWeb3) 

## Components

* [underscore.js](http://underscorejs.org) v1.8.3
* [localstorejs](https://github.com/SilentCicero/LocalStore)  v0.1.9
* [ethereumjs-tx](https://github.com/ethereum/ethereumjs-tx) v0.2.3
* [browserify-cryptojs](https://github.com/fahad19/crypto-js/) v0.3.1


## Licence

Released under the MIT License, see LICENSE file.
