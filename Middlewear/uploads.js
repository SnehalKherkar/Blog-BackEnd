const multer =require('multer');

// const storage=multer.diskStorage({
//     destination:(req, file, cb)=>{
//         cb(null,`uploads`)
//     },
//     filename: (req, file, cb)=>{
//         console.log(file);
//         cb(null, Date.now()+ path.extname(file.originalname));
//     }
// })

// const upload=multer({storage:storage});

const upload = multer({
    limits: {
      fileSize: 1024 * 1024 * 10,
    },
    fileFilter: function (req, file, done) {
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "video/mp4"
      ) {
        done(null, true);
      } else {
        //prevent the upload
        var newError = new Error("File type is incorrect");
        newError.name = "MulterError";
        done(newError, false);
      }
    },
  });

module.exports=upload;