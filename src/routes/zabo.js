import express from "express"
import { logger } from "../utils/logger";
import { authMiddleware } from "../middlewares"
import mongoose from "mongoose"
import { sizeS3Item } from "../utils/aws"

import { User, Zabo, Pin } from "../db"
import { photoUpload } from "../utils/aws"

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { id } = req.query
    logger.zabo.info("get /zabo/ request; id: %s", id);

    if (!id) {
      logger.zabo.error("get /zabo/ request error; 400 - null id");
      return res.status(400).json({
        error: 'bad request: null id',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.zabo.error("get /zabo/ request error; 400 - invalid id");
      return res.status(400).json({
        error: "bad request: invalid id",
      });
    }

    const zabo = await Zabo.findOne({_id: id})
    if (!zabo) {
      logger.zabo.error("get /zabo/ request error; 404 - zabo does not exist");
      return res.status(404).json({
        error: "not found: zabo does not exist",
      });
    }
    else {
      return res.json(zabo);
    }

  } catch (error) {
    logger.zabo.error(error)
    return res.status(500).json({
      error: error.message,
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const zabos = await Zabo.find({}).sort({'createdAt': -1}).limit(10)
      .populate('createdBy')
      .populate('owner')
    res.send(zabos)
  } catch (error) {
    logger.zabo.error(error)
    return res.status(500).json({
      error: error.message,
    });
  }
});

router.get('/list/next', async (req, res) => {
  try {
    const { id } = req.query;
    logger.zabo.info("get /zabo/list/next request; id: %s", id);

    if (!id) {
      logger.zabo.error("get /zabo/list/next request error; 400 - null id");
      return res.status(400).json({
        error: "id required"
      });
    }

    const previousZabo = await Zabo.findOne({_id: req.query.id});
    if (previousZabo === null) {
      logger.zabo.error("get /zabo/list/next request error; 404 - zabo does not exist");
      return res.status(404).json({
        error: "zabo does not exist",
      });
    }
    else {
      let lowestTime = previousZabo.createdAt;
      const nextZaboList = await Zabo.find({createdAt: {$lt: lowestTime}}).sort({'createdAt': -1}).limit(10);
      return res.json(nextZaboList);
    }

  } catch (error) {
    logger.zabo.error(error)
    return res.status(500).json({
      error: error.message,
    });
  }
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

router.post('/',  authMiddleware, photoUpload.array("img", 20), async (req, res) => {
  try {
    let { title, description, category, endAt } = req.body
    const { sid } = req.decoded
    logger.zabo.info("post /zabo/ request; title: %s, description: %s, category: %s, endAt: %s, files info: %s", title, description, category, endAt, req.files);
    category = (category || "").toLowerCase().split('#').filter(x => !!x)
    if (!req.files || !title || !description || !endAt) {
      logger.zabo.error("post /zabo/ request error; 400");
      return res.status(400).json({
        error: 'bad request',
      });
    }
    const user = await User.findOne({ sso_sid: sid })
    if (!user.currentGroup) {
      return res.status(403).json({
        error: "Requested User Is Not Currently Belonging to Any Group"
      })
    }

    const newZabo = new Zabo({ title, description, category, endAt });

    const calSizes = []

    for (let i=0; i < req.files.length; i++) {
      let s3ImageKey = req.files[i].key;
      calSizes.push(sizeS3Item(s3ImageKey))
    }

    const results = await Promise.all(calSizes)
    const photos = results.map(([dimensions, bytesRead], index) => {
      return {
        url: req.files[index].location,
        width: dimensions.width,
        height: dimensions.height,
      }
    })
    newZabo.photos.concat(photos)
    await newZabo.save()
    return res.send(newZabo);
  } catch (error) {
    logger.zabo.error(error)
    return res.status(500).json({
      error: error.message,
    })
  }
});

router.post('/pin', authMiddleware, async (req, res) => {
  try {
    let { zaboId } = req.body;
    let { sid } = req.decoded;
    logger.zabo.info("post /zabo/pin request; zaboId: %s, sid: %s", zaboId, sid);
    let boardId;

    if (!zaboId) {
      logger.zabo.error("post /zabo/pin request error; 400 - null id");
      return res.status(400).json({
        error: "null id",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(zaboId)) {
      logger.zabo.error("post /zabo/pin request error; 400 - invalid id");
      return res.status(400).json({
        error: "invalid id",
      });
    }

    // find boardId of user
    const user = await User.findOne({ sso_sid: sid })
    if (user === null) {
      logger.zabo.error("post /zabo/pin request error; 404 - user does not exist");
      return res.status(404).json({
        error: "user does not exist",
      });
    }
    boardId = user.boards[0]

    // .catch(error => {
    //   console.log("user not found")
    //   throw error
    // })
    let userId = user._id;

    // edit zabo pins
    const zabo = await Zabo.findById(zaboId)
    if (zabo === null) {
      logger.zabo.error("post /zabo/pin request error; 404 - zabo does not exist");
      return res.status(404).json({
        error: "zabo does not exist",
      });
    }

    let newPin = new Pin({
      pinnedBy: userId,
      zaboId,
      boardId,
    });

    // save new pin
    const pin = await newPin.save();

    zabo.pins.push(pin._id);
    await zabo.save();

    return res.send({ zabo, newPin });
  } catch (error) {
    logger.zabo.error(error)
    return res.status(500).send({
      error: error.message
    })
  }
});

router.delete('/', async (req, res) => {
  try {
    const { id } = req.body;
    logger.zabo.info("delete /zabo/ request; id: %s", id);

    if (!id) {
      logger.zabo.error("delete /zabo/ request error; 400 - null id");
      return res.status(400).json({
        error: 'bad request: null id',
      });
    }

    await Zabo.deleteOne({_id: req.body.id});
    return res.send('zabo successfully deleted');

  } catch (error) {
    logger.zabo.error(error)
    return res.status(500).json({
      error: error.message,
    });
  }
});

router.delete('/pin', authMiddleware, async (req, res) => {
  try {
    let { zaboId } = req.body;
    let { sid } = req.decoded;
    logger.zabo.info("delete /zabo/pin request; zaboId: %s, sid: %s", zaboId, sid);
    let boardId;

    if (!zaboId) {
      logger.zabo.error("delete /zabo/pin request error; 400 - null id");
      return res.status(400).json({
        error: "bad request: null id",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(zaboId)) {
      logger.zabo.error("delete /zabo/pin request error; 400 - invalid id");
      return res.status(400).json({
        error: "bad request: invalid id",
      });
    }

    // find boardId of user
    const user = await User.findOne({ sso_sid: sid })
    if (!user) {
      logger.zabo.error("delete /zabo/pin request error; 404 - user does not exist");
      return res.status(404).json({
        error: "not found: user does not exist",
      })
    }
    boardId = user.boards[0]

    // delete the pin
    const deletedPin = await Pin.findOneAndDelete({zaboId, boardId});
    logger.zabo.info("delete /zabo/pin request; deleted pin: %s", deletedPin);

    // edit zabo pins
    const zabo = await Zabo.findById(zaboId)
    if (!zabo) {
      logger.zabo.error("delete /zabo/pin request error; 404 - zabo does not exist");
      return res.status(404).json({
        error: "not found: zabo does not exist",
      })
    }
    let newPins = zabo.pins.filter(pin => pin.toString() !== deletedPin._id.toString());
    logger.zabo.info("delete /zabo/pin request; edited zabo pins: %s", newPins);
    zabo.pins = newPins;
    await zabo.save();
    return res.send({ zabo });

  } catch (error) {
    logger.zabo.error(error)
    return res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
