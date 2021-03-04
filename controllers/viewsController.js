const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

exports.getOverView = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //console.log(req.params.name);
  const tour = await Tour.findOne({ slug: req.params.name }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  //console.log(tour);
  res.status(200).render('tour', {
    tour
  });
});
