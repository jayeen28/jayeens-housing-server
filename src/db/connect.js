const mongoose = require('mongoose');

(async () => {
    try {
        mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true
        }, err => {
            if (err) return console.error(err)
            console.log('Mongodb connected!')
        })
    }
    catch (e) {
        console.error(e.message)
    }
})();