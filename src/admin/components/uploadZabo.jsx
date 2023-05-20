import React from 'react'
import { Box, H3 } from '@adminjs/design-system'

//admin user가 외부 단체의 자보를 올려줄 때 사용하는 액션
const uploadZaboComponent = (props) => {
  const {record} = props;
  console.log("uploadZaboAction component")
  console.log(record)
 
  return (
    <Box flex>
      <H3>This is sample upload zabo action</H3>
    </Box>
  ) 
};

export default uploadZaboComponent;