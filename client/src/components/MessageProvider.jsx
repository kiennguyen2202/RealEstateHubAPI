import React from 'react';
import { message } from 'antd';

const MessageProvider = () => {
    const [messageApi, contextHolder] = message.useMessage();
  
    const baseStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '13px',
      maxWidth: '320px',
      whiteSpace: 'normal',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };
  
    const showMessage = {
      success: (content) => {
        messageApi.open({
          type: 'success',
          content,
          duration: 1.5,
          style: {
            ...baseStyle,
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            color: '#52c41a',
          },
        });
      },
      error: (content) => {
        messageApi.open({
          type: 'error',
          content,
          duration: 1.5,
          style: {
            ...baseStyle,
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            color: '#ff4d4f',
          },
        });
      },
    };
  
    return { showMessage, contextHolder };
  };
  

export default MessageProvider; 