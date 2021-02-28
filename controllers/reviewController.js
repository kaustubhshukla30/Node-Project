const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.getAllReview = handlerFactory.getAll(Review);

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.create(req.body);
  res.status(201).json({
    message: 'Success',
    result: newReview
  });
});

exports.getReview = handlerFactory.getOne(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
