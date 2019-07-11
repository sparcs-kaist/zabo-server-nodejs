import express from "express"
const router = express.Router();
const gm = require('gm');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const size = require('s3-image-size');

const multer = require('multer');
const multers3 = require('multer-s3');
let upload = multer({
  storage: multers3({
    s3: s3,
    bucket: 'sparcs-kaist-zabo-cookie',
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, Date.now().toString());
    },
  })
});

import { Zabo } from "../db"

router.get('/', (req, res) => {
  if (!req.query.id) {
    console.log('null id error');
    return res.error('1');
  }

  Zabo.findOne({_id: req.query.id}, (err, zabo) => {
    if (err) {
      console.log(err);
      return res.error('1');
    }
    else if (zabo === null) {
      console.log('zabo does not exist');
      return res.error('1');
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
      return res.error('1');
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
      return res.sendStatus(500);
    }
    else if (zabo === null) return res.status(404).json({
      error: "matched zabo not found"
    });
    else {
      let lowestTime = zabo.createdAt;
      Zabo.find({createdAt: {$lt: lowestTime}}).sort({'createdAt': -1}).limit(10).exec((err, zabo) => {
        if (err) {
          console.error(err);
          return res.sendStatus(500);
        }
        else return res.json(zabo);
      })
    }
  })
});

router.get('/downloadimgfroms3', (req, res) => {
  // 프런트로부터 어떤 값이 온다고 가정해야 할까?
  // 일단 s3에 올라가있는 이름 그대로 온다고 가정함
  let imgInfo = {
    Bucket: "sparcs-kaist-zabo-cookie", 
    Key: req.query.key
   };

   s3.getObject(imgInfo, (err, data) => {
     if (err) console.log(err); // an error occurred
     else res.send(data.Body); // successful response
     /*
     data = {
      AcceptRanges: "bytes", 
      ContentLength: 3191, 
      ContentType: "image/jpeg", 
      ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"", 
      LastModified: <Date Representation>, 
      Metadata: {
      }, 
      TagCount: 2, 
      VersionId: "null"
     }
     */
   });

  // 또 다른 방법 : img url 을 준 다음 프런트에서 <img url="서버에서 준 url"> 으로 하기
  // 이게 서버의 로드를 쓰지 않고 클라이언트에서 쓰는 거라 더 나아보이는데, cookie의 생각은 어떠세용
  // postman으로 테스트해봤을 때 1MB 파일을 보내는데도 몇 초 걸리더라구요,, 사진 20장 보내면 꽤나 걸릴듯
  //  res.send("https://sparcs-kaist-zabo-cookie.s3.ap-northeast-2.amazonaws.com/" + req.query.key);
});

router.post('/', upload.array("img", 20), (req, res) => {
  if (!req.files.length || !req.body.title || !req.body.description || !req.body.type || !req.body.endAt) {
    return res.error('null data detected');
  }

  const newZabo = new Zabo();

  for (let i=0; i < req.files.length; i++) {
    newZabo.photos[i].url = req.files[i].location;
    let s3ImageKey = req.files[i].location.split('/')[-1];
    size(s3, 'sparcs-kaist-zabo-cookie', s3ImageKey, (err, dimensions, bytesRead) => {
      newZabo.photos[i].width = dimensions.width;
      newZabo.photos[i].height = dimensions.height;
    })
  }
  newZabo.title.type = req.body.title;
  newZabo.description.type = req.body.description;
  newZabo.category.type = req.body.type;
  newZabo.endAt = req.body.endAt;

  newZabo.save(err => {
    if (err){
      console.log(err);
      res.error(err);
    } 
    console.log('new zabo has successfully saved');
    res.send('new zabo has successfully saved');
  });
});

router.post('/uploadimgtos3', upload.array("img", 20), (req, res) => { // 임시로 지은 이름
  res.send(req.files);
  // res.send('Successfully uploaded ' + req.files.length + ' files!');
});

router.delete('/', (req, res) => {
  if (!req.body.id) {
    console.log('null id error');
    return res.error('1');
  }

  Zabo.deleteOne({_id: req.body.id}, (err, zabo) => {
    if (err) {
      console.log(err);
      return res.error('1');
    }
    else {
      console.log('zabo successfully deleted');
      return res.send('1');
    }
  });
});

module.exports = router;