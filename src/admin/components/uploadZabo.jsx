import React, {useState} from 'react'
import { H3, Input, Button } from '@adminjs/design-system';
import axios from 'axios';

const gridLayoutCompareFunction = (a, b) => {
  const { x: ax, y: ay } = a.updatedLayout;
  const { x: bx, y: by } = b.updatedLayout;
  if (ay - by) return ay - by;
  return ax - bx;
};

const loadImageFile = (file) => {
  console.log("start loadimagefile function");
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  return new Promise((res) => {
    img.onload = () => {
      res(img);
    };
    img.src = objectUrl;
  });
};

const cropImage = async (file, ratio) => {
  const image = await loadImageFile(file);
  const { width, height } = image;
  const ownRatio = width / height;
  let dWidth;
  let dHeight;
  const canvas = document.createElement("canvas");
  if (ownRatio > ratio) {
    dHeight = height;
    dWidth = height * ratio;
  } else {
    dWidth = width;
    dHeight = width / ratio;
  }
  canvas.width = dWidth;
  canvas.height = dHeight;
  const context = canvas.getContext("2d");
  if (!context) return "";
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // crop it top center
  context.drawImage(image, 0, 0, dWidth, dHeight, 0, 0, dWidth, dHeight);
  // const base64ImageData = canvas.get(0).toDataURL();
  // const imgSrc = canvas.toDataURL ('image/png');
  return canvas.toDataURL("image/jpeg");
};

const dataURLToBlob = (dataURL) => {
  const blobBin = atob(dataURL.split(",")[1]);
  const array = [];
  for (let i = 0; i < blobBin.length; i += 1) {
    array.push(blobBin.charCodeAt(i));
  }
  // const file = new Blob ([new Uint8Array (array)], { type: 'image/png' });
  return new Blob([new Uint8Array(array)]);
};

const imageFileGetWidthHeight = async (file) => {
  console.log("start imagefilegetwidthheight function");
  const image = await loadImageFile(file);
  console.log("finish loadimagefile function");
  const { width, height } = image;
  return { width, height, ratio: width / height };
};

//admin user가 외부 단체의 자보를 올려줄 때 사용하는 액션
const uploadZaboComponent = (props) => {
  console.log("printing props");
  console.log(props);
  const [zaboList, setZaboList] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [schedule, setSchedule] = useState({});

  const handleZaboChange = (e) => {
    const files = Array.from(e.target.files);
    const newZaboList = files.map((file, index) => {
      const preview = URL.createObjectURL(file);
      const i = files.length + index;
      const key = `${file.name}-${i}`;
      const layout = {
        x: i % 5, //TODO: What cols mean
        y: Math.floor(i / 5),
        w: 1,
        h: 1,
        i: key,
      }

      return Object.assign(file, {
        preview,
        key,
        layout,
        updatedLayout: layout,
      });
    });
    setZaboList(newZaboList);
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  }

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  }

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  }


  const handleZaboUpload = async () => {

    //identify itself 
    const adminInfo = await axios.get("http://localhost:3000/api/admin");
    const isAdmin = adminInfo.data.success;
    const adminName = adminInfo.data.adminName;
    
    if(!isAdmin) {
      //not admin 
      console.log("Not admin");
      return;
    }

    if(!zaboList) {
      //TODO: show error message that there is no file to upload 
      return;
    }

    const zaboJSON = {};
    zaboJSON["title"] = title;
    zaboJSON["description"] = description;
    zaboJSON["category"] = category;
    zaboJSON["files"] = [];
    //TODO: handle if schedule exists
    // formData.append("schedule", schedule);


    //resize images
    const sortedImageFiles = await zaboList.slice()
    await sortedImageFiles.sort(gridLayoutCompareFunction);
    
    console.log(sortedImageFiles);

    const {width, height} = await imageFileGetWidthHeight(sortedImageFiles[0]);
    console.log("finish getwidthheight function");
    console.log(`width: ${width}, height: ${height}`);
    const ratio = width / height;
    if (ratio > 2) ratio = 2;
    else if (ratio < 0.5) ratio = 0.5;
    const sources = await Promise.all(sortedImageFiles.map((file) => cropImage(file, ratio)));
    sources.forEach((imgSrc) => {
      const blob = dataURLToBlob(imgSrc);
      zaboJSON["files"].push(blob);
    });
    console.log(zaboList);
    //await uploadZabo(zaboJSON);
    console.log("uploading zabo");
    await axios.post('http://localhost:3000/admin/api/resources/Zabo/actions/uploadZabo', zaboJSON);
    console.log("upload finish!");

    return
  }
  
  return (
    <div>
      <H3>This is sample upload zabo action</H3>
      <br/>
      <Input type="text" onChange={handleTitleChange} placeholder="title"/>
      <br/>
      <Input type="text" onChange={handleDescriptionChange} placeholder="description"/>
      <br/>
      <Input type="text" onChange={handleCategoryChange} placeholder="category"/>
      <br/>
      <Input type="text" placeholder="schedule(disabled)" disabled="True"/>

      <br/>
      <Input type="file" onChange={handleZaboChange} multiple/>
      <br/>
      <br/>
      <br/>
      <Button size="icon" rounded="True" onClick={handleZaboUpload}>Submit</Button>
      <br/>
      <br/>
      <br/>
      <img id='testing'></img>
    </div>
  ) 
};

export default uploadZaboComponent;

//admin flow for uploading zabo

//1. admin user clicks upload zabo button

//2. admin user fills out the form: title, description, category, schedule, zabo files

//3. The image validation check(size check) is done. And create form data, send API request to server.

//4. Send API request to server with form data