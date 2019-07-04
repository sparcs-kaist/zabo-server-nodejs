import express from "express"
const router = express.Router();

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

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
  if (!req.body.id) {
    console.log('null id error');
    return res.error('1');
  }

  Zabo.findOne({_id: req.body.id}, (err, zabo) => {
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

router.post('/', (req, res) => {
  const newZabo = new Zabo(req.body);
  // console.log(req.body);

  newZabo.save(err => {
    if (err){
      console.log(err);
      res.error('1')
    } 
    console.log('new zabo has successfully saved');
    res.send('1');
  });
});

router.post('/uploadimgtos3', upload.array("img", 20), (req, res) => { // 임시로 지은 이름
  res.send('Successfully uploaded ' + req.files.length + ' files!')
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