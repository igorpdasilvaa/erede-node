

const http = require('https');
const bl = require('bl');
const { URL } = require('url');
const RedeError = require('../exception/RedeError');
const Transaction = require('../transaction');

module.exports = class TransactionService {
  constructor(store) {
    this.store = store;
  }

  static get POST() {
    return 'POST';
  }

  static get GET() {
    return 'GET';
  }

  static get PUT() {
    return 'PUT';
  }

  getUrl() {
    const { endpoint } = this.store.environment;

    return `${endpoint}/transactions`;
  }

  static async execute() {
    throw new Error('Ńão implementado');
  }

  sendRequest(method, body = '') {
    const url = new URL(this.getUrl());
    const options = {
      hostname: url.hostname,
      post: 443,
      path: url.pathname,
      method,
      auth: `${this.store.filiation}:${this.store.token}`,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    return new Promise((resolve, reject) => {
      const client = http.request(options, (response) => {
        response.setEncoding('utf8');
        response.pipe(bl((error, data) => {
          if (error) {
            reject(error);
          }

          let json = JSON.parse(data.toString());

          if (response.statusCode >= 400) {
            if (!json || json.returnMessage === undefined) {
              json = {};
              json.returnMessage = 'Alguma coisa aconteceu';
              json.returnCode = '-1';
            }

            reject(new RedeError(json.returnMessage, json.returnCode));
          }

          resolve(Transaction.fromJSON(json));
        }));
      });

      client.write(body);
      client.end();
    });
  }
};
