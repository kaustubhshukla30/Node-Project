const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const reviewRouter = express.Router({ mergeParams: true });

reviewRouter
  .route('/')
  .get(authController.protect, reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserId,
    reviewController.createReview
  );

reviewRouter
  .route('/:id')
  .get(authController.protect, reviewController.getReview)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = reviewRouter;
