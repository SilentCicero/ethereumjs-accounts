/**
ethereumjs-accounts - A suite for managing Ethereum accounts in browser.

Welcome to ethereumjs-accounts. Generate, encrypt, manage, export and remove Ethereum accounts and store them in your browsers local storage. You may also choose to extendWeb3 so that transactions made from accounts stored in browser, can be signed with the private key provided. EthereumJs-Accounts also supports account encryption using the AES encryption protocol. You may choose to optionally encrypt your Ethereum account data with a passphrase to prevent others from using or accessing your account.

Requires:
 - cryptojs v0.3.1  <https://github.com/fahad19/crypto-js>
 - localstorejs *  <https://github.com/SilentCicero/localstore>
 - ethereumjs-tx v0.4.0  <https://www.npmjs.com/package/ethereumjs-tx>
 - ethereumjs-tx v1.2.0  <https://www.npmjs.com/package/ethereumjs-util>
 - Underscore.js v1.8.3+  <http://underscorejs.org/>
 - Web3.js v0.4.2+ <https://github.com/ethereum/web3.js>

Commands:
    (Browserify)
    browserify --s Accounts index.js -o dist/ethereumjs-accounts.js

    (Run)
    node index.js

    (NPM)
    npm install ethereumjs-accounts

    (Meteor)
    meteor install silentcicero:ethereumjs-accounts    
**/

var _ = require('underscore');
var Tx = require('ethereumjs-tx');
var LocalStore = require('localstorejs');
var BigNumber = require('bignumber.js');
var JSZip = require("jszip");
var FileSaver = require("node-safe-filesaver");
global.CryptoJS = require('browserify-cryptojs');
require('browserify-cryptojs/components/enc-base64');
require('browserify-cryptojs/components/md5');
require('browserify-cryptojs/components/evpkdf');
require('browserify-cryptojs/components/cipher-core');
require('browserify-cryptojs/components/aes');

/**
The Accounts constructor method. This method will construct the in browser Ethereum accounts manager.

@class Accounts
@constructor
@method (Accounts)
@param {Object} options       The accounts object options.
**/

var Accounts = module.exports = function(options){
    if(_.isUndefined(options))
        options = {};
    
    // setup default options
    var defaultOptions = {
        varName: 'ethereumAccounts'
        , minPassphraseLength: 6
        , requirePassphrase: false
        , selectNew: true
        , defaultGasPrice: 'useWeb3'
        , request: function(accountObject){
            var passphrase = prompt("Please enter your account passphrase for address " + accountObject.address.substr(0, 8) + '...', "passphrase");
            
            if(passphrase == null)
                passphrase = '';
            
            return String(passphrase);
        }
    };
    
    // build options
    this.options = _.extend(defaultOptions, options);
    
    // define Accounts object properties
    defineProperties(this);
    
    // get accounts object, if any
    var accounts = LocalStore.get(this.options.varName);
    
    // if no accounts object exists, create one
    if(_.isUndefined(accounts) || !_.isObject(accounts))
        LocalStore.set(this.options.varName, {});
};


/**
Pad the given string with a prefix zero, if length is uneven.

@method (formatHex)
@param {String} str    The string to pad for use as hex
@return {String} The padded or formatted string for use as a hex string
**/

var formatHex = function(str){
    return String(str).length % 2 ? '0' + String(str) : String(str);
};


/**
Prepair numbers for raw transactions.

@method (formatNumber)
@param {Number|String|BigNumber} The object to be used as a number
@return {String} The padded, toString hex value of the number
**/

var formatNumber = function(num){
    if(_.isUndefined(num) || _.isEmpty(num))
        num = '00';
    
    if(_.isString(num) || _.isNumber(num))
        num = new BigNumber(String(num)).toString(16);
    
    if(isBigNumber(num))
        num = num.toString(16);
    
    return formatHex(num);
};


/**
Prepair Ethereum address for either raw transactions or browser storage.

@method (formatAddress)
@param {String} addr    An ethereum address to prep
@param {String} format          The format type (i.e. 'raw' or 'hex')
@return {String} The prepaired ethereum address
**/

var formatAddress = function(addr, format){
    if(_.isUndefined(format) || !_.isString(format))
        format = 'hex';
    
    if(_.isUndefined(addr)
       || !_.isString(addr))
        addr = '0000000000000000000000000000000000000000';
    
    if(addr.substr(0, 2) == '0x' && format == 'raw')
        addr = addr.substr(2);
    
    if(addr.substr(0, 2) != '0x' && format == 'hex')
        addr = '0x' + addr;
    
    return addr;
};


/**
Generate 16 random alpha numeric bytes.

@method (randomBytes)
@param {Number} length      The string length that should be generated
@return {String} A 16 char/UTF-8 byte string of random alpha-numeric characters
**/

var randomBytes = function(length) {
    var charset = "abcdef0123456789";
    var i;
    var result = "";
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
    if(window.crypto && window.crypto.getRandomValues) {
        values = new Uint32Array(length);
        window.crypto.getRandomValues(values);
        for(i=0; i<length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    } else if(isOpera) {//Opera's Math.random is secure, see http://lists.w3.org/Archives/Public/public-webcrypto/2013Jan/0063.html
        for(i=0; i<length; i++) {
            result += charset[Math.floor(Math.random()*charset.length)];
        }
        return result;
    }
    else throw new Error("Your browser sucks and can't generate secure random numbers");
}


/**
Is the object provided a Bignumber object.

@method (isBigNumber)
**/

var isBigNumber = function(value){
    if(_.isUndefined(value) || !_.isObject(value))
        return false;
    
    return (value instanceof BigNumber) ? true : false;
};

/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
 **/

var isAddress = function (address) {
    return /^(0x)?[0-9a-f]{40}$/.test(address);
};


/**
Define object properties such as 'length'.

@method (defineProperties)
@param {Object} context     The Accounts object context
**/

var defineProperties = function(context){
    Object.defineProperty(context, 'length', {
        get: function() {
            var count = 0;

            // count valid accounts in browser storage
            _.each(this.get(), function(account, accountIndex){  
                if(_.isUndefined(account)
                  || !_.isObject(account)
                  || _.isString(account))
                    return;

                if(!_.has(account, 'encrypted')
                   || !_.has(account, 'private'))
                    return;

                count += 1;
            });

            return count;
        }
    });
};


/**
Returns true when a valid passphrase is provided.

@method (isPassphrase)
@param {String} passphrase    A valid ethereum passphrase
@return {Boolean} Whether the passphrase is valid or invalid.
**/

Accounts.prototype.isPassphrase = function(passphrase){
    if(!_.isUndefined(passphrase)
       && _.isString(passphrase)
       && !_.isEmpty(passphrase)
       && String(passphrase).length > this.options.minPassphraseLength)
        return true;
};


/**
This will set in browser accounts data at a specified address with the specified accountObject data.

@method (set)
@param {String} address          The address of the account
@param {Object} accountObject    The account object data.
**/

Accounts.prototype.set = function(address, accountObject){
    var accounts = LocalStore.get('ethereumAccounts');    
    
    // if object, store; if null, delete
    if(_.isObject(accountObject))
        accounts[formatAddress(address)] = accountObject;   
    else
        delete accounts[formatAddress(address)];
    
    LocalStore.set(this.options.varName, accounts);
};


/**
Remove an account from the Ethereum accounts stored in browser

@method (remove)
@param {String} address          The address of the account stored in browser
**/

Accounts.prototype.remove = function(address){
    this.set(address, null);
};


/**
Generate a new Ethereum account in browser with a passphrase that will encrypt the public and private keys with AES for storage.

@method (new)
@param {String} passphrase          The passphrase to encrypt the public and private keys.
@return {Object} an account object with the public and private keys included.
**/

Accounts.prototype.new = function(passphrase){
    var private = new Buffer(randomBytes(64), 'hex');
    var public = ethUtil.privateToPublic(private);
    var address = formatAddress(ethUtil.publicToAddress(public)
                                .toString('hex'));
    var accountObject = {
        address: address
        , encrypted: false
        , locked: false
        , hash: ethUtil.sha3(public.toString('hex') + private.toString('hex')).toString('hex')
    };
    
    // if passphrrase provided or required, attempt account encryption
    if((!_.isUndefined(passphrase) && !_.isEmpty(passphrase)) 
        || this.options.requirePassphrase){
        if(this.isPassphrase(passphrase)) {
            private = CryptoJS.AES
                .encrypt(private.toString('hex'), passphrase)
                .toString();
            public = CryptoJS.AES
                .encrypt(public.toString('hex'), passphrase)
                .toString();
            accountObject.encrypted = true;
            accountObject.locked = true;
        } else {
            console.log('The passphrase you tried to use was invalid.');
        }
    }else{
        private = private.toString('hex')
        public = public.toString('hex')
    }
    
    // Set account object private and public keys
    accountObject.private = private;
    accountObject.public = public;
    this.set(address, accountObject);
    
    // If option select new is true
    if(this.options.selectNew)
        this.select(accountObject.address);
    
    return accountObject;
};


/**
Select the account that will be used when transactions are made.

@method (select)
@param {String} address          The address of the account to select
**/

Accounts.prototype.select = function(address) {
    var accounts = LocalStore.get(this.options.varName);
    
    if(!this.contains(address))
        return;
    
    accounts['selected'] = address;
    LocalStore.set(this.options.varName, accounts);
};


/**
Get an account object that is stored in local browser storage. If encrypted, decrypt it with the passphrase.

@method (new)
@param {String} passphrase          The passphrase to encrypt the public and private keys.
@return {Object} an account object with the public and private keys included.
**/

Accounts.prototype.get = function(address, passphrase){
    var accounts = LocalStore.get(this.options.varName);    
    
    if(_.isUndefined(address) || _.isEmpty(address))
        return accounts;
    
    if(address == 'selected')
        address = accounts.selected;
    
    var accountObject = {};    
    address = formatAddress(address);
    
    if(!this.contains(address))
        return accountObject;
    
    accountObject = accounts[address];
    
    if(_.isEmpty(accountObject))
        return accountObject;
    
    // If a passphrase is provided, decrypt private and public key
    if(this.isPassphrase(passphrase) && accountObject.encrypted) {
        try {
            accountObject.private = CryptoJS.AES
                .decrypt(accountObject.private, passphrase)
                .toString(CryptoJS.enc.Utf8);
            accountObject.public = CryptoJS.AES
                .decrypt(accountObject.public, passphrase)
                .toString(CryptoJS.enc.Utf8);
            
            if(ethUtil.sha3(accountObject.public + accountObject.private).toString('hex') == accountObject.hash)
                accountObject.locked = false;
        }catch(e){
            console.log('Error while decrypting public/private keys: ', e);
        }
    }
    
    return accountObject;
};


/**
Clear all stored Ethereum accounts in browser.

@method (clear)
**/

Accounts.prototype.clear = function(){
    LocalStore.set(this.options.varName, {});
};


/**
Does the account exist in browser storage, given the specified account address.

@method (contains)
@param {String} address          The account address
@return {Boolean} Does the account exists or not given the specified address
**/

Accounts.prototype.contains = function(address){
    var accounts = LocalStore.get(this.options.varName);
    
    if(_.isUndefined(address)
       || _.isEmpty(address))
        return false;
    
    // Add '0x' prefix if not available
    address = formatAddress(address);
    
    // If account with address exists.
    if(_.has(accounts, address))
        return (!_.isUndefined(accounts[address]) && !_.isEmpty(accounts[address]));
    
    return false;
};


/**
Export the accounts to a JSON ready string.

@method (export)
@return {String} A JSON ready string
**/

Accounts.prototype.export = function(){
    return JSON.stringify(this.get());
};


/**
Import a JSON ready string. This will import JSON data, parse it, and attempt to use it as accounts data.

@method (import)
@param {String} A JSON ready string
@return {String} How many accountObject's were added
**/

Accounts.prototype.import = function(JSON_data){
    var JSON_data = JSON_data.trim();
    var parsed = JSON.parse(JSON_data);
    var count = 0;
    var _this = this;
    
    _.each(parsed, function(accountObject, accountIndex){
        if(!_.has(accountObject, 'private')
           || !_.has(accountObject, 'hash')
           || !_.has(accountObject, 'address')
           || !_.has(accountObject, 'encrypted')
           || !_.has(accountObject, 'locked'))
            return;
        
        count += 1;
        _this.set(accountObject.address, accountObject);
    });
    
    return count;
};


/**
Backup your accounts in a zip file.

@method (backup)
**/

Accounts.prototype.backup = function(){
    var zip = new JSZip();
    zip.file("wallet", this.export());
    var content = zip.generate({type:"blob"});
    var dateString = new Date();
    FileSaver.saveAs(content, "wallet-" + dateString.toISOString() + ".zip");
};


/**
This method will override web3.eth.sendTransaction, and assemble transactions given the data provided, only for transactions sent from an account stored in browser. If sendTransaction is used with a normal account not stored in browser, sendTransaction will not be overridden.

@method (extendWeb3)
**/

Accounts.prototype.extendWeb3 = function(){
    // If web3 is not init. yet
    if(typeof web3 === "undefined") {
        console.log('WARNING: The web3 object does not exist or has not been initiated yet. Please include and initiate the web3 object');
        return;
    }
    
    // If web3 does not have sendRawTransaction
    if(!_.has(web3.eth, 'sendRawTransaction')) {
        console.log('WARNING: The web3 object does not contain the sendRawTransaction method which is required to extend web3.eth.sendTransaction. Please use an edition of web3 that contains the method "web3.eth.sendRawTransaction".');        
        return;
    }
    
    // Store old instance of sendTransaction and sendRawTransaction
    var transactMethod = web3.eth.sendTransaction;
    var rawTransactionMethod = web3.eth.sendRawTransaction;
    
    // Accounts instance
    var accounts = this;
    
    // Get default gas price
    if(this.options.defaultGasPrice == 'useWeb3') {
        web3.eth.getGasPrice(function(err, result){            
            if(!err)
                accounts.gasPrice = result;
        });
    }
    
    // Override web3.eth.sendTransaction
    web3.eth.sendTransaction = function(){
        var args = Array.prototype.slice.call(arguments);
        var optionsObject = {};
        var callback = null;
        var positions = {};
        
        // Go through sendTransaction args (param1, param2, options, etc..)
        _.each(args, function(arg, argIndex){
            // the arg is an object, thats not a BN, so it's the options
            if(_.isObject(arg) 
               && !isBigNumber(arg) 
               && !_.isFunction(arg) 
               && _.has(arg, 'from')) {
                optionsObject = arg;
                positions['options'] = argIndex;
            }
            
            // the arg is a function, so it must be the callback
            if(_.isFunction(arg)) {
                callback = arg;
                positions.callback = argIndex;
            }
        });

        if (callback == null) {
            throw new Error("You must provide a callback to web3.eth.sendTransaction() when using ethereumjs-accounts")
        }
        
        // if from is an account stored in browser, build raw TX and send
        if(accounts.contains(optionsObject.from)) {            
            // Get the account of address set in sendTransaction options, from the accounts stored in browser
            var account = accounts.get(optionsObject.from);
            
            // if the account is encrypted, try to decrypt it
            if(account.encrypted) {
                account = accounts.get(optionsObject.from
                                       ,accounts.options.request(account));
            }
            
            // if account is still locked, quit
            if(account.locked) {
                console.log('Account locked!');
                return;
            }
            
            web3.eth.getTransactionCount(account.address, function(err, getNonce) {
                if (err != null) {
                    callback(err);
                    return;
                }

                web3.eth.getGasPrice(function(err, gasPrice) {
                    if (err != null) {
                        callback(err);
                        return;
                    }

                    // Assemble the default raw transaction data
                    var rawTx = {
                        nonce: formatHex(getNonce),
                        gasPrice: formatHex(gasPrice.toString(16)),
                        gasLimit: formatHex(new BigNumber('1900000').toString(16)),
                        value: '00',
                        data: '00'
                    };

                    // Set whatever properties are available from the sendTransaction options object
                    if(_.has(optionsObject, 'gasPrice'))
                        rawTx.gasPrice = formatHex(formatNumber(optionsObject.gasPrice));
                    
                    if(_.has(optionsObject, 'gas'))
                        rawTx.gasLimit = formatHex(formatNumber(optionsObject.gas));
                    
                    if(_.has(optionsObject, 'to'))
                        rawTx.to = ethUtil.stripHexPrefix(optionsObject.to);
                    
                    if(_.has(optionsObject, 'value'))
                        rawTx.value = formatNumber(optionsObject.value);
                    
                    if(_.has(optionsObject, 'data'))
                        rawTx.data = ethUtil.stripHexPrefix(formatHex(optionsObject.data));
                    
                    if(_.has(optionsObject, 'code'))
                        rawTx.data = ethUtil.stripHexPrefix(formatHex(optionsObject.code));
                    
                    // convert string private key to a Buffer Object
                    var privateKey = new Buffer(account.private, 'hex');
                    
                    // init new transaction object, and sign the transaction
                    var tx = new Tx(rawTx);
                    tx.sign(privateKey);
                    
                    // Build a serialized hex version of the Tx
                    var serializedTx = '0x' + tx.serialize().toString('hex');
                    
                    //console.log('Raw Tx', rawTx, 'Options Object', optionsObject, 'Account', account, 'Nonce', getNonce, 'Serialized', serializedTx);
                    
                    // call the web3.eth.sendRawTransaction with 
                    rawTransactionMethod(serializedTx, callback);   
                });
            });
        }else{
            // If the transaction is not using an account stored in browser, send as usual with web3.eth.sendTransaction
            transactMethod.apply(this, args);
        }
    };
};