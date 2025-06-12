import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { messageService } from '../../api/messageService';

import { useAuth } from '../../auth/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './MessagingFeature.css';

// Component avatar mặc định, lấy chữ cái đầu tên
const DefaultAvatar = ({ name, avatarUrl }) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5134${avatarUrl}`}
        alt={name}
        className="default-avatar"
      />
    );
  }
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className="default-avatar flex items-center justify-center text-white font-bold bg-gray-400">
      {initial}
    </div>
  );
};
const quickReplies = [
  "Căn hộ này còn không ạ?",
  "Tình trạng giấy tờ như thế nào ạ?",
  "Tôi có thể trả góp không?",
  "Giá có thương lượng không ạ?",
  // ... thêm các câu khác nếu muốn
];
const MessagingFeature = () => {
  const { user } = useAuth();
  const location = useLocation();

  const currentUserId = user?.id;

  // Danh sách hội thoại
  const [conversations, setConversations] = useState([]);
  // Cuộc hội thoại đang chọn
  const [selectedConversation, setSelectedConversation] = useState(null);
  // Tin nhắn trong cuộc hội thoại đang chọn
  const [messages, setMessages] = useState([]);
  // Trạng thái loading, error
  const [loading, setLoading] = useState(true); // Loading for initial conversations list
  const [loadingMessages, setLoadingMessages] = useState(false); // Loading for messages of selected conversation
  const [error, setError] = useState(null);

  // Gửi tin nhắn
  const [newMessageContent, setNewMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [inputError, setInputError] = useState(null);

  // Ref để cuộn xuống cuối danh sách tin nhắn
  const messagesEndRef = useRef(null);

  // Hàm cuộn xuống cuối tin nhắn. Chỉ cuộn khi có tin nhắn mới thực sự ở cuối.
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

   // State để theo dõi liệu có nên cuộn xuống khi messages thay đổi không
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  // Effect để cuộn khi shouldScrollToBottom là true
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom();
      setShouldScrollToBottom(false); // Reset sau khi cuộn
    }
  }, [shouldScrollToBottom]); // Depend only on shouldScrollToBottom


  // Lấy danh sách hội thoại khi currentUserId hoặc query param thay đổi
  useEffect(() => {
    if (!currentUserId) {
      setError('Vui lòng đăng nhập để xem tin nhắn');
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);

        // Lấy tất cả tin nhắn user tham gia
        const messagesData = await messageService.getUserMessages(currentUserId);

        // Map để gom nhóm thành các cuộc hội thoại
        const conversationMap = new Map();
        messagesData.forEach((message) => {
          // Key phân biệt conversation theo postId và user còn lại
          const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
          const otherUserAvatarUrl = message.senderId === currentUserId ? message.receiverAvatarUrl : message.senderAvatarUrl;

          const key = `${message.postId}-${otherUserId}`;
          let postUsername = message.PostUserName || 'Không rõ';
          if (message.post?.user?.name) {
            postUsername = message.post.user.name;
          } else if (conversationMap.has(key) && conversationMap.get(key).postUsername) {
            postUsername = conversationMap.get(key).postUsername;
          }
          if (!conversationMap.has(key)) {
            conversationMap.set(key, {
              postId: message.postId,
              postTitle: message.PostTitle || message.postTitle || message.post?.Title || 'Không rõ tiêu đề post',
              otherUserId,
              otherUserName: message.senderId === currentUserId ? message.receiverName : message.senderName,
              otherUserAvatarUrl,
              lastMessage: message,
              // *** Lấy post username từ message object (nếu API trả về) ***
              postUsername: message.PostUserName || message.postUserName || 'Không rõ',
            });
          } else {
            // Cập nhật lastMessage nếu tin nhắn mới hơn
            const conv = conversationMap.get(key);
            if (new Date(message.sentTime) > new Date(conv.lastMessage.sentTime)) {
              conv.lastMessage = message;
               conv.postUsername = conv.postUsername || postUsername;
              conversationMap.set(key, conv);
            }
          }
        });

        const fetchedConversations = Array.from(conversationMap.values());
        // Sort conversations by last message time, newest first
        fetchedConversations.sort((a, b) => new Date(b.lastMessage?.sentTime) - new Date(a.lastMessage?.sentTime));

        setConversations(fetchedConversations);
        setError(null);

        // Lấy query param chọn cuộc hội thoại ban đầu nếu có
        const params = new URLSearchParams(location.search);
        const initialPostId = parseInt(params.get('postId'));
        const initialUserId = parseInt(params.get('userId'));
        const initialPostTitle = params.get('postTitle');
        const initialPostUsername = params.get('postUsername');

        if (initialPostId && initialUserId) {
          // Find conversation in the fetched list
          const conversationToSelect = fetchedConversations.find(
            (conv) => conv.postId === initialPostId && conv.otherUserId === initialUserId
          );
          if (conversationToSelect) {
    // Ưu tiên giữ lại postUsername từ param nếu API không trả về
    setSelectedConversation({
      ...conversationToSelect,
      postUsername: conversationToSelect.postUsername || initialPostUsername,
    });
  } else {
             // If not found in the list (e.g., new conversation), set basic info
              setSelectedConversation({
                postId: initialPostId,
                otherUserId: initialUserId,
                postTitle: initialPostTitle,
                otherUserName: null,
                postUsername: initialPostUsername,
                lastMessage: null,
             });
        
           }
        } else if (fetchedConversations.length > 0) {
          // Mặc định chọn cuộc hội thoại đầu tiên nếu không có param
          setSelectedConversation(fetchedConversations[0]);
        } else {
          setSelectedConversation(null);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Không thể tải danh sách tin nhắn. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUserId, location.search]); // Added location.search as dependency


  // Lấy tin nhắn khi thay đổi cuộc hội thoại
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        // Thay đổi từ getPostMessages sang getConversation
        const data = await messageService.getConversation(currentUserId, selectedConversation.otherUserId, selectedConversation.postId);

        // Sort messages by sentTime in ascending order (oldest first)
        const sortedMessages = data.sort((a, b) => new Date(a.sentTime) - new Date(b.sentTime));

        if (isMounted) {
          setMessages(sortedMessages);
          setShouldScrollToBottom(true);
          // *** Cập nhật selectedConversation details nếu ban đầu bị thiếu TỪ MESSAGES ***
          // Điều này đảm bảo header hiển thị đúng thông tin sau khi tải tin nhắn
          // Đây là fallback nếu fetchPostDetails không chạy hoặc thông tin từ messages đầy đủ hơn
          if (sortedMessages.length > 0) {
  const firstMessage = sortedMessages[0];
  setSelectedConversation(prev => {
    // Nếu đã có đủ thông tin thì không set lại nữa để tránh lặp
    const newPostTitle = prev.postTitle || firstMessage.postTitle;
    const newOtherUserName = prev.otherUserName || (firstMessage.senderId === selectedConversation.otherUserId
      ? firstMessage.senderName
      : firstMessage.receiverName);
    // CHỈ cập nhật postUsername nếu lấy được từ message, nếu không giữ nguyên
    const newPostUsername = prev.postUsername || firstMessage.post?.user?.name;
    if (
      prev.postTitle === newPostTitle &&
      prev.otherUserName === newOtherUserName &&
      prev.postUsername === newPostUsername
    ) {
      return prev;
    }
    return {
      ...prev,
      postTitle: newPostTitle,
      otherUserName: newOtherUserName,
      postUsername: newPostUsername,
    };
  });
}

          // *** Cuộn xuống cuối chỉ khi tin nhắn được tải lần đầu cho cuộc hội thoại này ***
          // Đây là logic để cuộn khi mở một cuộc hội thoại mới hoặc tải lại trang
          // Có thể cuộn tức thì (auto) để tránh gián đoạn cuộn lên xem tin cũ
           if (messages.length === 0 && sortedMessages.length > 0) {
             
                scrollToBottom(false); // Cuộn tức thì
           }


        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        // Handle error fetching messages, maybe set messages to empty and show error message in chat area
      } finally {
        if (isMounted) setLoadingMessages(false); // End loading messages
      }
    };

    fetchMessages();

    // Poll messages every 3 seconds
    // const intervalId = setInterval(fetchMessages, 5000);

    // return () => {
    //   isMounted = false;
    //   clearInterval(intervalId);
    // };
  }, [selectedConversation]); // Depend only on selectedConversation changing


  // Xử lý gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessageContent.trim()) return;

    if (!user || !selectedConversation || !selectedConversation.otherUserId || !selectedConversation.postId) {
        setInputError('Thông tin cuộc hội thoại chưa đầy đủ.');
        return;
    }


    // Thêm check để đảm bảo otherUserId tồn tại trước khi so sánh
     if (user.id === selectedConversation.otherUserId) {
       setInputError('Bạn không thể gửi tin nhắn cho chính mình.');
       return;
     }


    try {
      setSending(true);
      setInputError(null);

      const messageData = {
        senderId: user.id,
        receiverId: selectedConversation.otherUserId,
        postId: selectedConversation.postId,
        content: newMessageContent.trim(),
      };

      // Temporarily add the new message to the state for instant display
       // This avoids waiting for the re-fetch and makes UI feel faster
       const tempNewMessage = {
           id: `temp-${Date.now()}`, // Temporary ID
           senderId: user.id,
           receiverId: selectedConversation.otherUserId,
           postId: selectedConversation.postId,
           content: newMessageContent.trim(),
           sentTime: new Date().toISOString(),
           senderName: user.name, // Add sender name for display
           receiverName: selectedConversation.otherUserName, // Add receiver name for display
           postTitle: selectedConversation.postTitle, // Add post title for display
           post: { user: { name: selectedConversation.postUsername } }, // Add post owner info if available
       };

      // Add the temporary message and sort, then scroll
      setMessages(prevMessages => {
          const updated = [...prevMessages, tempNewMessage];
           // Sort including the new temp message
           return updated.sort((a, b) => new Date(a.sentTime) - new Date(b.sentTime));
      });

       // Scroll to bottom immediately after adding the temp message
       scrollToBottom();

      setNewMessageContent(''); // Clear input immediately

      // Send the message to the backend
      await messageService.sendMessage(messageData);

      // Cập nhật lại lastMessage trong conversation list
       // Tìm và cập nhật cuộc hội thoại tương ứng
      setConversations(prevConversations => {
        const index = prevConversations.findIndex(conv =>
          conv.postId === selectedConversation.postId && conv.otherUserId === selectedConversation.otherUserId
        );

        const latestMessageForConv = { // Create a message object for updating lastMessage
             ...messageData, // basic message data
             sentTime: new Date().toISOString(), // client-side time
             senderName: user.name, // current user's name
             // Other details like postTitle, receiverName/otherUserName, postUsername might be needed depending on list display requirements
             // It's best if the object structure matches the conversationMap logic above
              postTitle: selectedConversation.postTitle,
              otherUserName: selectedConversation.otherUserName,
              postUsername: selectedConversation.postUsername,
        };


        if (index > -1) {
          const newConversations = [...prevConversations];
          const updatedConv = {
            ...newConversations[index],
            lastMessage: latestMessageForConv, // Use the constructed lastMessage object
          };
          // Optionally move the updated conversation to the top of the list
           newConversations.splice(index, 1);
           newConversations.unshift(updatedConv); // Add at the beginning
          return newConversations;
        } else {
           // Case where the conversation was not in the initial list (e.g. first message sent to a post via URL)
           // Add this new conversation to the list. Use details from selectedConversation.
            const newConv = {
               postId: selectedConversation.postId,
               otherUserId: selectedConversation.otherUserId,
               postTitle: selectedConversation.postTitle || 'Tiêu đề không rõ', // Use existing or fallback
               otherUserName: selectedConversation.otherUserName || 'Đối tác không rõ', // Use existing or fallback
               postUsername: selectedConversation.postUsername || 'Người đăng không rõ', // Use existing or fallback
               lastMessage: latestMessageForConv, // Use the constructed lastMessage object
            };
           // Add at the top
           return [newConv, ...prevConversations];
        }
      });


    } catch (err) {
      setInputError(err.message || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      console.error('Error sending message:', err);
      // If sending fails, maybe remove the temporary message or show error state on it.
      // For now, just show input error.
       setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempNewMessage.id)); // Remove temporary message on error
    } finally {
      setSending(false);
    }
  };


  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mt-4">
          <p className="text-center text-gray-600">
            Vui lòng{' '}
            <a href="/login" className="text-blue-500 hover:underline">
              đăng nhập
            </a>{' '}
            để nhắn tin
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <span>Đang tải danh sách hội thoại...</span> {/* More specific loading message */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="messaging-feature-container" style={{ paddingTop: '2.5rem' }}>
      <h1 className="text-2xl font-bold mb-4">Tin nhắn</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[700px]">
        {/* Danh sách hội thoại */}
        <div className="md:col-span-2 conversation-list">
          <h2 className="text-lg font-semibold mb-4">Danh sách hội thoại</h2>
          <div className="overflow-y-auto h-[calc(100%-60px)]">
             {/* Loading state handled above */}
            {!loading && conversations.length === 0 && (
              <div className="text-gray-500 text-center">Bạn chưa có cuộc hội thoại nào.</div> // Centered text
            )}
            {conversations.map((conv) => {
              const isSelected =
                selectedConversation?.postId === conv.postId &&
                selectedConversation?.otherUserId === conv.otherUserId;
              return (
                <div
                  key={`${conv.postId}-${conv.otherUserId}`}
                  className={`conversation-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSelectedConversation(conv);
                  }}
                >
                  {/* Avatar and Content area for list items */}
                   {/* Sử dụng DefaultAvatar tạm thời, có thể thay bằng ảnh thật nếu có */}
                  <div className="item-image">
                    <DefaultAvatar
                      name={conv.otherUserName}
                      avatarUrl={conv.otherUserAvatarUrl}/>
                  </div>
                  <div className="item-content">
                     {/* *** Hiển thị Post Title *** */}
                    <div className="font-medium truncate">{conv.postTitle || 'Không rõ tiêu đề post'}</div>
                    {/* *** Hiển thị Người đăng bài post *** */}
                     {conv.postUsername && <div className="text-sm text-gray-600 truncate">Người đăng: {conv.postUsername}</div>}
                     {/* *** Hiển thị Người nhận/Đối tác chat *** */}
                    <div className="text-sm text-gray-600 truncate">Đối tác: {conv.otherUserName || 'Không rõ'}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.content || 'Chưa có tin nhắn nào'}
                    </div>
                  </div>
                  <button
  className="delete-conv-btn"
  onClick={async (e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa hội thoại này?')) {
      try {
        await messageService.deleteConversation(currentUserId, conv.otherUserId, conv.postId);
        setConversations(prev => prev.filter(
          c => !(c.postId === conv.postId && c.otherUserId === conv.otherUserId)
        ));
        if (
          selectedConversation &&
          selectedConversation.postId === conv.postId &&
          selectedConversation.otherUserId === conv.otherUserId
        ) {
          setSelectedConversation(null);
          setMessages([]);
        }
      } catch (err) {
        alert('Xóa hội thoại thất bại!');
      }
    }
  }}
  title="Xóa hội thoại"
>🗑️</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Khung chat */}
        <div className="md:col-span-1 message-box flex flex-col">
          {selectedConversation ? (
            <>
              <div className="message-box-header border-b">
                 {/* *** Hiển thị thông tin từ selectedConversation nếu có *** */}
                 {/* Không dùng fallback "Đang tải..." trực tiếp ở đây nữa nếu fetchPostDetails chạy sớm */}
                 <h2 className="text-lg font-semibold truncate">
                   Tin nhắn về: {selectedConversation.postTitle || '...'}                 
                 </h2>
                 
                 <h2 className="text-lg font-semibold truncate">
                   Người đăng: {selectedConversation.postUsername || '...'}                 
                 </h2>
                 
                 
              </div>

              <div className="message-list-container flex-1 overflow-y-auto px-4 py-2">
                {/* Loading state for messages */}
                {loadingMessages && (
                  <p className="text-center text-gray-500 mt-4">Đang tải tin nhắn...</p>
                )}

                 {/* Chỉ hiển thị thông báo "Chưa có tin nhắn" khi tải xong và danh sách rỗng */}
                {!loadingMessages && messages.length === 0 && (
                  <p className="text-center text-gray-500 mt-4">Chưa có tin nhắn nào trong cuộc hội thoại này.</p>
                )}

                 {/* Render tin nhắn chỉ khi không loading (để tránh hiển thị tin nhắn cũ khi đang tải lại) và có tin nhắn */}
                {!loadingMessages && messages.length > 0 && messages.map((message) => {
  const isSent = message.senderId === user.id;
  return (
    <div
      key={message.id}
      className={`message-item ${isSent ? 'message-sent' : 'message-received'}`}
    >
      {/* Tin nhắn nhận: avatar bên trái, bubble bên phải */}
      {!isSent && (
        <>
          <div className="avatar">
            <DefaultAvatar name={message.senderName}
             avatarUrl={message.senderAvatarUrl || message.sender?.avatarUrl} />
          </div>
          <div className="message-content">
            <div className="message-bubble">{message.content}</div>
            <span className="message-time">
  {formatDistanceToNow(
    // Chuyển sang giờ Việt Nam (UTC+7)
    new Date(new Date(message.sentTime).getTime() + 7 * 60 * 60 * 1000),
    { locale: vi, addSuffix: true }
  )}
</span>
          </div>
        </>
      )}
      {/* Tin nhắn gửi: bubble bên trái, avatar bên phải */}
      {isSent && (
        <>
          <div className="message-content">
            <div className="message-bubble">{message.content}</div>
            <span className="message-time">
  {formatDistanceToNow(
    // Chuyển sang giờ Việt Nam (UTC+7)
    new Date(new Date(message.sentTime).getTime() + 7 * 60 * 60 * 1000),
    { locale: vi, addSuffix: true }
  )}
</span>
          </div>
          <div className="avatar">
            <DefaultAvatar
              name={user?.name || ''}
              avatarUrl={user?.avatarUrl}
            />
          </div>
        </>
      )}
    </div>
  );
})}


                <div ref={messagesEndRef} />
              </div>
              <div className="quick-replies-bar">
  {quickReplies.map((text, idx) => (
    <button
      key={idx}
      className="quick-reply-btn"
      onClick={() => setNewMessageContent(text)}
      type="button"
    >
      {text}
    </button>
  ))}
</div>
              <form onSubmit={handleSendMessage} className="message-input-container">
                
  <div className="input-wrapper">
    <input
      type="text"
      value={newMessageContent}
      onChange={(e) => setNewMessageContent(e.target.value)}
      placeholder="Nhập tin nhắn..."
      disabled={sending}
      aria-label="Nhập tin nhắn"
    />
    
    <button type="submit" disabled={sending || !newMessageContent.trim()}>
      <span style={{fontSize: '1.3rem'}}>➤</span>
    </button>
  </div>
</form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-lg p-4 no-conversation-selected">
              {loading ? (
                <p className="text-gray-500">Đang tải danh sách hội thoại...</p>
              ) : (
                <p className="text-gray-500">Chọn một cuộc hội thoại để xem tin nhắn</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingFeature;
