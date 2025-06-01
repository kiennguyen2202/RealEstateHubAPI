import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosPrivate from "../api/axiosPrivate";
import { useAuth } from "../auth/AuthContext";

function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const [isViewingSpecificConversation, setIsViewingSpecificConversation] = useState(false);

  // Lấy thông tin từ URL params nếu có và xác định chế độ hiển thị
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postId = params.get('postId');
    const userId = params.get('userId');
    
    if (postId && userId) {
      setIsViewingSpecificConversation(true);
      // Cần fetch thông tin chi tiết của post và user này để hiển thị
      const fetchSpecificPostAndUser = async () => {
        try {
          // Fetch thông tin bài đăng
          const postRes = await axiosPrivate.get(`/api/posts/${postId}`);
          setSelectedPost(postRes.data);

          // Fetch thông tin người dùng (người mà user hiện tại đang nhắn tin)
          const userRes = await axiosPrivate.get(`/api/users/${userId}`);
          setSelectedUser(userRes.data);

          setLoading(false);
        } catch (err) {
          console.error("Error fetching specific post or user:", err);
          setError("Không thể tải thông tin cuộc trò chuyện");
          setLoading(false);
        }
      };
      fetchSpecificPostAndUser();

    } else {
      setIsViewingSpecificConversation(false);
      // Nếu không có params, fetch danh sách users và posts bình thường
      const fetchData = async () => {
        try {
          // Lưu ý: Các API này cần tồn tại ở backend và trả về danh sách phù hợp
          const [usersResponse, postsResponse] = await Promise.all([
            axiosPrivate.get('/api/users'), // API lấy danh sách người dùng
            axiosPrivate.get('/api/posts') // API lấy danh sách bài đăng
          ]);
          setUsers(usersResponse.data);
          setPosts(postsResponse.data);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Không thể tải dữ liệu");
          setLoading(false);
        }
      };
      fetchData();
    }

    // Kiểm tra trạng thái đăng nhập
    if (!user) {
      navigate("/");
    }

  }, [location.search, user, navigate]);

  // Fetch tin nhắn khi chọn user và post (hoặc khi params có sẵn)
  useEffect(() => {
    if (selectedUser && selectedPost && user) {
      const fetchMessages = async () => {
        try {
          const response = await axiosPrivate.get(
            `/api/messages/${user.id}/${selectedUser.id}/${selectedPost.id}`
          );
          setMessages(response.data);
          // Đánh dấu tin nhắn đã đọc - cần backend API hỗ trợ việc này
          // setUnreadCounts(prev => ({
          //   ...prev,
          //   [`${selectedUser.id}-${selectedPost.id}`]: 0
          // }));
        } catch (err) {
          console.error("Error fetching messages:", err);
          setError("Không thể tải tin nhắn");
        }
      };

      fetchMessages();
    }
  }, [selectedUser, selectedPost, user]);

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kiểm tra tin nhắn mới định kỳ chỉ khi đang xem cuộc trò chuyện cụ thể
  useEffect(() => {
    if (!selectedUser || !selectedPost || !user || !isViewingSpecificConversation) return;
    
    const checkNewMessages = async () => {
      try {
        const response = await axiosPrivate.get(
          `/api/messages/${user.id}/${selectedUser.id}/${selectedPost.id}`
        );
        const newMessages = response.data;
        
        // Chỉ cập nhật nếu có tin nhắn mới hơn
        if (newMessages.length > messages.length) {
          setMessages(newMessages);
          // Cập nhật số tin nhắn chưa đọc - cần backend API hỗ trợ
          // const unreadCount = newMessages.filter(
          //   m => m.receiverId === user.id && !m.isRead
          // ).length;
          // setUnreadCounts(prev => ({
          //   ...prev,
          //   [`${selectedUser.id}-${selectedPost.id}`]: unreadCount
          // }));
        }
      } catch (err) {
        console.error("Error checking new messages:", err);
      }
    };

    const interval = setInterval(checkNewMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedUser, selectedPost, user, messages.length, isViewingSpecificConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !selectedPost || !user) return;

    try {
      const response = await axiosPrivate.post("/api/messages", {
        senderId: user.id,
        receiverId: selectedUser.id,
        postId: selectedPost.id,
        content: newMessage
      });

      // Thêm tin nhắn vừa gửi vào danh sách hiển thị ngay lập tức
      setMessages(prev => [...prev, response.data]);
      setNewMessage("");
      
      // Cần API backend để đánh dấu tin nhắn đã gửi là đã đọc bên phía người gửi
      // hoặc cập nhật trạng thái unreadCounts cho người nhận nếu có

    } catch (err) {
      console.error("Error sending message:", err);
      alert("Không thể gửi tin nhắn");
    }
  };

  // Render dựa vào chế độ xem
  if (loading && !isViewingSpecificConversation) return <div className="text-center p-4">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">

            {/* Sidebar - Chỉ hiển thị khi KHÔNG xem cuộc trò chuyện cụ thể */}
            {!isViewingSpecificConversation && (
              <div className="border-r">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Tin nhắn</h2>
                </div>
                <div className="overflow-y-auto h-[calc(100%-4rem)]">
                  {/* Danh sách bài đăng - Đây là khung sườn, cần phát triển thêm */}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">Bài đăng</h3>
                    {posts.map(post => (
                      <div
                        key={post.id}
                        className={`p-2 rounded cursor-pointer hover:bg-gray-50 ${
                          selectedPost?.id === post.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedPost(post)}
                      >
                        <p className="font-medium">{post.title}</p>
                        <p className="text-sm text-gray-500 truncate">{post.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Danh sách người dùng - Đây là khung sườn, cần phát triển thêm */}
                  <div className="p-4 border-t">
                    <h3 className="font-semibold mb-2">Người dùng</h3>
                    {users.map(otherUser => (
                      otherUser.id !== user.id && (
                        <div
                          key={otherUser.id}
                          className={`p-2 rounded cursor-pointer hover:bg-gray-50 ${
                            selectedUser?.id === otherUser.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => setSelectedUser(otherUser)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{otherUser.name}</p>
                              <p className="text-sm text-gray-500">{otherUser.email}</p>
                            </div>
                            {/* Số tin nhắn chưa đọc - Cần backend API hỗ trợ */}
                            {/* {unreadCounts[`${otherUser.id}-${selectedPost?.id}`] > 0 && (
                              <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                                {unreadCounts[`${otherUser.id}-${selectedPost?.id}`]}
                              </span>
                            )} */}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Khu vực chat - Chiếm toàn bộ chiều rộng nếu đang xem cuộc trò chuyện cụ thể */}
            <div className={`flex flex-col ${isViewingSpecificConversation ? 'md:col-span-3' : 'md:col-span-2'}`}>
              {/* Hiển thị thông tin người dùng và bài đăng đang chat */}
              {selectedUser && selectedPost ? (
                <>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-500">Về bài đăng: {selectedPost.title}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Hiển thị tin nhắn */}
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === user?.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {/* Hiển thị thời gian gửi */}
                            {new Date(message.sentTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* Form gửi tin nhắn */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Nhập tin nhắn..."
                      />
                      <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        Gửi
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                // Hiển thị khi chưa chọn cuộc trò chuyện hoặc đang tải
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  {isViewingSpecificConversation 
                    ? "Đang tải cuộc trò chuyện..." 
                    : "Chọn người dùng và bài đăng để bắt đầu trò chuyện"
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages; 