const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      ratings: [{ userId: req.auth.userId, grade: bookObject.ratings[0].grade }],
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  book.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id
  }).then(
    (book) => {
      res.status(200).json(book);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.addNote = (req, res, next) => {
    Book.findOne({
        _id: req.params.id
      }).then(
        (book) => {
            for (const rating of book.ratings) {
                if (rating.userId === req.auth.userId) {
                console.log(req.body)
                  return res.status(400).json({
                    error: "L'utilisateur a déjà une note pour ce livre"
                  });
                }
            }
            let newAverageRating = req.body.rating;
            let count = 0;
            book.ratings.forEach((rating) => {
                newAverageRating += rating.grade;
                count++;
              });
            newAverageRating = Math.floor(newAverageRating / (count+1));
            let newRatings = book.ratings;
            newRatings.push({userId : req.auth.userId, grade: req.body.rating});
            book.ratings = newRatings;
            book.averageRating = newAverageRating;
            Book.updateOne({ _id: req.params.id}, {ratings : newRatings, averageRating : newAverageRating})
                .then(() => res.status(200).json(book))
                .catch(error => res.status(401).json({ error }));
        }
      ).catch(
        (error) => {
          res.status(404).json({
            error: error
          });
        }
      );
  
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getAllStuff = (req, res, next) => {
  Book.find().then(
    (books) => {
      res.status(200).json(books);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.getBestRating = (req, res, next) => {
    Book.find().sort({
        averageRating: -1
      }).limit(3).then(
        (books) => {
          res.status(200).json(books);
        }
      ).catch(
        (error) => {
          res.status(400).json({
            error: error
          });
        }
      );
};