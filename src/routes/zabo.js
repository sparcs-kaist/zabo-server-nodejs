import express from "express"
import { authMiddleware } from "../middlewares"


const router = express.Router();
const mongoose = require('mongoose');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const size = require('s3-image-size');

const multer = require('multer');
const multers3 = require('multer-s3');
let upload = multer({
  storage: multers3({
    s3: s3,
    bucket: 'sparcs-kaist-zabo-dev',
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, Date.now().toString());
    },
  })
});

import { User, Zabo, Pin } from "../db"

router.get('/', (req, res) => {
  const { id } = req.query
  if (!id) {
    console.log('null id error');
    return res.status(400).json({
      error: 'bad request: null id detected',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "bad request: invalid id",
    });
  }

  Zabo.findOne({_id: id}, (err, zabo) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: err.message,
      });
    }
    else if (zabo === null) {
      console.log('zabo does not exist');
      return res.status(404).json({
        error: "zabo does not exist",
      });
    }
    else {
      return res.json(zabo);
    }
  })
});

router.get('/list', (req, res) => {
  Zabo.find({}).sort({'createdAt': -1}).limit(10).exec((err, zabo) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: err.message,
      });
    }
    else {
      return res.json(zabo);
    }
  })
});

router.get('/list/next', (req, res) => {
  if (!req.query.id) {
    console.log('null id error');
    return res.status(400).json({
      error: "id required"
    });
  }

  Zabo.findOne({_id: req.query.id}, (err, zabo) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: err.message,
      });
    }
    else if (zabo === null) return res.status(404).json({
      error: "matched zabo not found"
    });
    else {
      let lowestTime = zabo.createdAt;
      Zabo.find({createdAt: {$lt: lowestTime}}).sort({'createdAt': -1}).limit(10).exec((err, zabo) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: err.message,
          });
        }
        else return res.json(zabo);
      })
    }
  })
});

// router.get('/downloadimgfroms3', (req, res) => {
//   프런트로부터 어떤 값이 온다고 가정해야 할까?
//   일단 s3에 올라가있는 이름 그대로 온다고 가정함
  // let imgInfo = {
  //   Bucket: "sparcs-kaist-zabo-dev", 
  //   Key: req.query.key
  //  };

  //  s3.getObject(imgInfo, (err, data) => {
  //    if (err) console.log(err); // an error occurred
  //    else res.send(data.Body); // successful response
  //  });

  // 또 다른 방법 : img url 을 준 다음 프런트에서 <img url="서버에서 준 url"> 으로 하기
  // 이게 서버의 로드를 쓰지 않고 클라이언트에서 쓰는 거라 더 나아보이는데, cookie의 생각은 어떠세용
  // postman으로 테스트해봤을 때 1MB 파일을 보내는데도 몇 초 걸리더라구요,, 사진 20장 보내면 꽤나 걸릴듯
//   Zabo.findOne({_id : req.query.id}, (err, zabo) => {
//     let responseArray = [];
//     for (let i=0; i < zabo.photos.length; i++) responseArray.push(zabo.photos[i].url);
//     res.send(responseArray);
//   });
// });

router.post('/', upload.array("img", 20), (req, res) => {
  const { title, description, category, endAt } = req.body

  try {
    if (!req.files || !title || !description || !category || !endAt) {
      return res.status(400).json({
        error: 'bad request',
      });
    }

    const newZabo = new Zabo({
      title,
      description,
      category,
      endAt
    });

    let count = 0
    const onFinish = () => {
      newZabo.save(err => {
        if (err){
          console.log(err);
          return res.status(500).json({
            error: err.message,
          });
        } 
        console.log('new zabo has successfully saved');
        return res.send('new zabo has successfully saved');
      });
    }

    for (let i=0; i < req.files.length; i++) {
      let s3ImageKey = req.files[i].key;
      size(s3, 'sparcs-kaist-zabo-cookie', s3ImageKey, (err, dimensions, bytesRead) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: err.message,
          })
        };
        let newPhoto = {
          url: req.files[i].location,
          width: dimensions.width,
          height: dimensions.height,
        }
        newZabo.photos.push(newPhoto);

        count++
        if (count === req.files.length) onFinish()
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      error: error.message
    })
  }
});

router.post('/pin', authMiddleware, async (req, res) => {
  try { 
    let { zaboId } = req.body;
    let { sid } = req.decoded;
    let boardId;

    if (!zaboId) return res.status(400).json({
      error: "null id detected",
    });

    if (!mongoose.Types.ObjectId.isValid(zaboId)) {
      return res.status(400).json({
        error: "invalid id",
      });
    }

    // find boardId of user
    const user = await User.findOne({ sso_sid: sid })
    if (user === null) {
      console.error("user not found");
      return res.status(404).json({
        error: "user does not exist",
      })
    }
    boardId = user.boards[0]

    // .catch(error => {
    //   console.log("user not found")
    //   throw error
    // })
    if (user === null) {
      console.log("user not found");
      return res.status(404).json({
        error: "user does not exist",
      });
    }
    
    // edit zabo pins
    const zabo = await Zabo.findById(zaboId)
    if (zabo === null) {
      console.log("zabo does not exist");
      return res.status(404).json({
        error: "zabo does not exist",
      })
    }
    
    let newPin = new Pin({
      pinnedBy: sid,
      zaboId,
      boardId,
    });

    // save new pin
    const pin = await newPin.save();

    zabo.pins.push(pin._id);
    await zabo.save();

    console.log("new pin has successfully saved");
    return res.send({ zabo, newPin });

  } catch (err) {
    console.error(err);
    return res.status(500).send({
      error: err.message
    })
  }
});

// router.post('/uploadimgtos3', upload.array("img", 20), (req, res) => { // 임시로 지은 이름
//   return res.send(req.files);
//   res.send('Successfully uploaded ' + req.files.length + ' files!');
// });

router.delete('/', (req, res) => {
  if (!req.body.id) {
    console.log('null id error');
    return res.status(400).json({
      error: 'bad request',
    });
  }

  Zabo.deleteOne({_id: req.body.id}, (err, zabo) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: err.message,
      });
    }
    else {
      console.log('zabo successfully deleted');
      return res.send('zabo successfully deleted');
    }
  });
});

module.exports = router;