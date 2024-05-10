import React, {useState} from 'react'
import { H3, Input, Button } from '@adminjs/design-system';
import axios from 'axios';

const addDevice = async (name, description, password) => {
    const response = await axios.post('/api/board/device',
    {
        name,
        description,
        password
    }
    );
}

const addDeviceComponent = (props) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [password, setPassword] = useState("");

    const handleNameChange = (e) => {
        setName(e.target.value);
    }

    const handleDescriptionChange = (e) => {
      setDescription(e.target.value);
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    }

    const handleDeviceSubmit = async() => {
        await addDevice(name, description, password);
    }

    return (
        <div>
            <H3> Create your zabo boards device</H3>
            <br/>
            <Input type="text" onChange={handleNameChange} placeholder="name" />
            <br/>
            <Input type="text" onChange={handleDescriptionChange} placeholder="description" />
            <br/>
            <Input type="password" onChange={handlePasswordChange} placeholder="password" />
            <br/>
            <Button size="icon" rounded="True" onClick={handleDeviceSubmit}>Submit</Button>
        </div>
    )
}

export default addDeviceComponent