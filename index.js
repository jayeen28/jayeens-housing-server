const express = require('express');
const app = express();
const cors = require('cors');
const admin = require("firebase-admin");
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const port = process.env.PORT || 5000;

//MIDDLEWARE
app.use(cors());
app.use(express.json())

//FIREBASE INITIALIZATION
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//MONGO CONNECT
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.urbpc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//VERIFY TOKEN
const verifyToken = async (req, res, next) => {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split(' ')[1];
        try {
            const { uid } = await admin.auth().verifyIdToken(idToken);
            req.decodeUserUid = uid;
        }
        catch {

        }
    }
    next();
}
//DATA PROCESSING
const run = async () => {
    try {
        await client.connect();

        //DATABASE 
        const database = client.db("jayeens_housing");
        const apartmentsCollection = database.collection("apartments");
        const usersCollection = database.collection("users");
        const bookedApartmentCollection = database.collection("booked_apartments");
        const reviewsCollection = database.collection("reviews");

        //GET ALL APARTMENTS
        app.get('/apartments', async (req, res) => {
            const cursor = apartmentsCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        //ADD A NEW APARTMENT
        app.post('/apartments/add', async (req, res) => {
            const apartmentData = req.body;
            const result = await apartmentsCollection.insertOne(apartmentData);
            res.json(result);
        });

        //DELETE APARTMENT
        app.delete('/apartments/delete', async (req, res) => {
            const { id } = req.query;
            const query = { _id: ObjectId(id) }
            const result = await apartmentsCollection.deleteOne(query);
            res.json(result);
        });

        //GET SINGLE APARTMENT
        app.get('/apartment/:id', async (req, res) => {
            const apartmentId = req.params.id;
            const query = { _id: ObjectId(apartmentId) };
            const cursor = apartmentsCollection.findOne(query);
            const result = await cursor;
            res.json(result);
        });

        //CUSTOMERS INFO MANAGEMENT
        app.put('/users', async (req, res) => {
            const customerInfo = req.body;
            const { uid } = customerInfo;
            const query = { uid: uid };
            const options = { upsert: true };
            const updateDoc = {
                $set: customerInfo
            };
            const result = await usersCollection.updateOne(query, updateDoc, options);
            res.json(result);
        });

        //GET CUSTOMER DATA
        app.get('/users', async (req, res) => {
            const { uid } = req.query;
            const query = { uid: uid };
            const result = await usersCollection.findOne(query);
            res.json(result)
        });

        //AUTHENTICATE USER ROLE
        app.get('/users/authenticate', verifyToken, async (req, res) => {
            const requesterUid = req.query.uid;
            const { decodeUserUid } = req;
            if (decodeUserUid === requesterUid) {
                const query = { uid: requesterUid };
                const { role } = await usersCollection.findOne(query);
                role === 'admin' ? res.json({ role: 'admin' })
                    : res.json({ role: 'customer' })
            }
            else {
                res.status(401).json({ Message: 'Unauthorized user' })
            }
        });

        //SEND APARTMENT BOOKINGS TO DATABSE
        app.post('/apartment/book', async (req, res) => {
            const apartmentInfo = req.body;
            const result = await bookedApartmentCollection.insertOne(apartmentInfo);
            res.json(result);
        });

        //GET UNPAID BOOKED APARTMENTS
        app.get('/bookedapartments/:paymentStat', async (req, res) => {
            const { paymentStat } = req.params;
            const query = { bookstatus: paymentStat }
            const cursor = bookedApartmentCollection.find(query)
            const result = await cursor.toArray();
            res.json(result);
        });

        //GET SINGLE BOOKED APARTMENT DATA
        app.get('/apartments/booked/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: ObjectId(id) };
            const result = await bookedApartmentCollection.findOne(query);
            res.json(result);
        })

        //FIND BOOKED APARTMENT PER CUSTOMER
        app.get('/apartments/find', async (req, res) => {
            const { uid } = req.query;
            const query = { 'bookingInfo.bookedBy': uid };
            const cursor = bookedApartmentCollection.find(query);
            const result = await cursor.toArray();
            res.json(result)
        });

        //UPDATE BOOKING STATUS
        app.put('/bookedapartments', async (req, res) => {
            const { id } = req.query;
            const { status } = req.body;
            const query = { _id: ObjectId(id) };
            const updateDoc = {
                $set: { bookstatus: status }
            }
            const result = await bookedApartmentCollection.updateOne(query, updateDoc);
            res.json(result);
        });

        //DELETE ANY BOOKING 
        app.delete('/bookedapartments/delete', async (req, res) => {
            const { id } = req.query;
            const query = { _id: ObjectId(id) }
            const result = await bookedApartmentCollection.deleteOne(query);
            res.json(result);
        });

        //MAKE ADMIN 
        app.put('/users/makeadmin', async (req, res) => {
            const { email } = req.query;
            const query = { email: email };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(query, updateDoc);
            res.json(result);
        });

        //ADD REVIEW 
        app.post('/reviews/add', async (req, res) => {
            const reviewContents = req.body;
            const result = await reviewsCollection.insertOne(reviewContents);
            res.json(result);
        });

        //GET ALL REVIEWS
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const result = await cursor.toArray();
            res.json(result);
        });

        //PAYMENT INTENT
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "USD",
                payment_method_types: ['card']
            })
            res.json({ clientSecret: paymentIntent.client_secret });
        })
    }

    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Jayeens housing node server is online')
});
app.listen(port, () => {
    console.log('Jayeens housing server is running on port =>', port)
})