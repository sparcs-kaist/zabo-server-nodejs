import React, {useState} from 'react'
import { H3, Input, Button } from '@adminjs/design-system';
import axios from 'axios';

const addDevice = async (deviceId, location, password) => {
    await axios.post('/api/admin/device',
    {
        deviceId,
        password,
        location
    }
    );

    return;
}

const addDeviceComponent = (props) => {
    const [deviceId, setDeviceId] = useState("");
    const [location, setLocation] = useState("");
    const [password, setPassword] = useState("");

    const handleDeviceIdChange = (e) => {
        setDeviceId(e.target.value);
    }

    const handleLocationChange = (e) => {
        setLocation(e.target.value);
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    }

    const handleDeviceSubmit = async() => {
        await addDevice(deviceId, location, password);
    }

    return (
        <div>
            <H3> Create your zabo boards device</H3>
            <br/>
            <Input type="text" onChange={handleDeviceIdChange} placeholder="deviceId"/>
            <br/>
            <Input type="text" onChange={handleLocationChange} placeholder="location" />
            <br/>
            <Input type="password" onChange={handlePasswordChange} placeholder="password" />
            <br/>
            <Button size="icon" rounded="True" onClick={handleDeviceSubmit}>Submit</Button>
        </div>
    )
}

export default addDeviceComponent