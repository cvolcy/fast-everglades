const mongoose = require('mongoose');

let booksSchema = new mongoose.Schema({
    sort: Number,
    en: {
        title: String,
        Description: String
    },
    fr: {
        title: String,
        Description: String
    }
}, { timestamps: true });

booksSchema.methods.localize = function(locale) {
    let locales = ['fr', 'en'];
    locales.push(locales.splice(locales.indexOf(locale), 1)[0]);
    
    let data = {_id: this._doc._id};
    
    for (let i = 0; i < locales.length; i++) {
        data = {...data, ...this._doc[locales[i]]}
    };
    
    return data;
};

mongoose.model('Books', booksSchema);