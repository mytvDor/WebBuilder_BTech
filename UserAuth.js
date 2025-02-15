// controller.js

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// MongoDB User schema and model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpire: { type: Date },
});

// User model
const User = mongoose.model('User', userSchema);

// Utility functions for password hashing and verification
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = `${salt}$${crypto.createHmac('sha256', salt).update(password).digest('hex')}`;
    return hashedPassword;
};

const verifyPassword = (inputPassword, storedPassword) => {
    const [salt, hashedPassword] = storedPassword.split('$');
    const inputHashedPassword = crypto.createHmac('sha256', salt).update(inputPassword).digest('hex');
    return inputHashedPassword === hashedPassword;
};

// Utility function to send emails
const sendEmail = async (email, subject, text) => {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'mytvdor@gmail.com', // Your email
                pass: 'fatu ftws zsbp fwnj', // Your email password
            },
        });

        await transporter.sendMail({
            from: 'mytvdor@gmail.com',
            to: email,
            subject: subject,
            text: text,
        });
        console.log('Email sent');
    } catch (error) {
        console.log('Error sending email:', error);
    }
};

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ msg: 'Token not provided' });

    jwt.verify(token, "mytoken", (err, user) => {
        if (err) return res.status(403).json({ msg: 'Invalid token' });
        req.user = user;
        next();
    });
};


const signup = async (req, res) => {

    const { name, email } = req.body; 
    const pass = req.body.password;
    try {

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
const password = await hashPassword(pass)
        user = new User({ name, email, password, otp, otpExpire });

        await user.save();

        await sendEmail(user.email, 'Email Verification', `Your OTP is ${otp}`);

        res.status(201).json({ msg: 'OTP sent to your email. Please verify.' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};

const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ msg: 'Invalid or expired OTP' });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        res.status(200).json({ msg: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};

const signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        console.log("pass 1")

        if (!user) return res.status(400).json({ msg: 'User not found' });
        if (!user.isVerified) return res.status(400).json({ msg: 'Please verify your email' });
        console.log("pass 2")

        if (!verifyPassword(password, user.password)) return res.status(400).json({ msg: 'Invalid credentials' });
        console.log("pass 3")

        const token = jwt.sign({ userId: user._id }, "mytoken", { expiresIn: '10000h' });
        console.log("pass 4")

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User not found' });

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpire = Date.now() + 10 * 60 * 1000;

        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();

        await sendEmail(user.email, 'Password Reset', `Your OTP is ${otp}`);

        res.status(200).json({ msg: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ msg: 'Invalid or expired OTP' });

        user.password = hashPassword(newPassword);
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        res.status(200).json({ msg: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};

const protectedRoute = (req, res) => {

    res.status(200).json({ msg: `Hello, user with ID: ${req.user.userId}` });
};

const signout = (req, res) => {
    res.status(200).json({ msg: 'Signed out' });
};

module.exports = {
    signup,
    verifyEmail,
    signin,
    forgotPassword,
    resetPassword,
    protectedRoute,
    authenticateToken,
    signout,
};
