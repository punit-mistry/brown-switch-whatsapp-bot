'use strict';
const request = require('request');
const PDFDocument = require('pdfkit');
const fs = require('fs');

module.exports = class EcommerceStore {
    constructor() {}
    async _fetchAssistant(endpoint) {
        return new Promise((resolve, reject) => {
            request.get(
                `https://fakestoreapi.com${endpoint ? endpoint : '/'}`,
                (error, res, body) => {
                    try {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                status: 'success',
                                data: JSON.parse(body),
                            });
                        }
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    }

    async getProductById(productId) {
        return await this._fetchAssistant(`/products/${productId}`);
    }
    async getAllCategories() {
        return await this._fetchAssistant('/products/categories?limit=100');
    }
    async getProductsInCategory(categoryId) {
        return await this._fetchAssistant(
            `/products/category/${categoryId}?limit=10`
        );
    }

    generatePDFInvoice({ order_details, file_path }) {
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(file_path));
        doc.fontSize(25);
        doc.text(order_details, 100, 100);
        doc.end();
        return;
    }

    generateRandomGeoLocation() {
        let storeLocations = [
            {
                latitude: 28.679079,
                longitude: 	77.069710,
                address: 'Delhi,India ',
            },
            {
                latitude: 26.907524,
                longitude: 75.739639,
                address: 'Jaipur, India',
            },
            {
                latitude: 19.155001,
                longitude: 72.849998,
                address: 'Goregaon, Mumbai, Maharashtra, India',
            },
        ];
        return storeLocations[
            Math.floor(Math.random() * storeLocations.length)
        ];
    }
};
