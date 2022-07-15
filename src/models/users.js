const { Schema, model } = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: true,
        validate(value) { if (!validator.isEmail(value)) throw new Error('Invalid email') }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) { if (value.toLowerCase().includes('password')) throw new Error('Password can not contain the word "Password"') }
    },
    avatar: {
        type: String,
        trim: true,
        required: false,
        validate(value) { if (!value.match(/(http(s ?): )([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g)) throw new Error('Invalid url.') }
    },
    phone: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    familyMember: {
        type: Number
    },
    active: {
        type: Boolean,
        required: true
    },
    role: {
        type: String,
        required: true,
        validate(value) { if (!['admin', 'owner', 'buyer', 'seller'].includes(value)) throw new Error('Invalid role') }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.tokens;
    return user;
}

userSchema.statics.findByCredentials = async function (email, pass) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Unable to sign in.')
    const passMatch = await bcrypt.compare(pass, user.password);
    if (!passMatch) throw new Error('Unable to sing in.')
    return user;
};

userSchema.methods.generateAuthToken = async function () {
    if (!this.active) throw new Error('Sorry your account is deactivated.');
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);
    this.tokens = this.tokens.concat({ token });
    await this.save();
    return token;
}

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    };
    next();
})

const User = model('User', userSchema);
module.exports = User;