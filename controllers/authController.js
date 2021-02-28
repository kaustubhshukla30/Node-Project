const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signUpToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET);
};

const createSendToken = (user, statusCode, res) => {
  const token = signUpToken(user.id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  user.password = undefined;
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo: req.body.photo,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    next(new AppError('Incorrrect email or password', 400));
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next(new AppError('Bad Request!! Please Login In!!', 401));
  }

  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decode.id);

  const user = await User.findById(decode.id);
  if (!user) next(new AppError('User Does not exist '));
  if (user.passwordChanged(decode.iat)) {
    next(new AppError('Password Changed! Login Again!', 401));
  }
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new AppError('Not Authorized to this route', 401));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Email not belong to any user', 404));
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password ? Use ${resetURL} to reset it. Ignore if you did'nt made this request`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset password token (Valid for 10 min)',
      message
    });
    res.status(200).json({
      status: 'Success',
      message: 'Email sent !!!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    next(new AppError('Email not sent! Please try again', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken
  });
  if (!user) {
    next(new AppError('Token Invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    next(new AppError('Please Login In', 401));
  }
  if (!req.body.newPassword || !req.body.newPasswordConfirm) {
    next(
      new AppError('Please enter new password and new confirm password ', 401)
    );
  }
  if (!(await user.correctPassword(req.body.password, user.password))) {
    next(new AppError('Incorrect password!!', 401));
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  createSendToken(user, 200, res);
});
