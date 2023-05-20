import React, {useState} from 'react'
import { Box, H3, Input, Button } from '@adminjs/design-system';


//admin user가 외부 단체의 자보를 올려줄 때 사용하는 액션
const uploadZaboComponent = (props) => {
  console.log(props)
  console.log("uploadZaboAction component")
  const [zaboList, setZaboList] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [schedule, setSchedule] = useState({});

  const handleZaboChange = (e) => {
    setZaboList(e.target.files);
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    console.log(title)
  }

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    console.log(description)
  }

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    console.log(category)
  }


  const handleZaboUpload = () => {
    if(!zaboList) {
      //TODO: show error message that there is no file to upload 
      return;
    }

    console.log("uploading zabo to server!");
    console.log(zaboList)

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    //TODO: handle if schedule exists
    // formData.append("schedule", schedule);

    //don't use zabo post api. implement within this function
    //because circumstances are different

    
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
    </div>
  ) 
};

export default uploadZaboComponent;